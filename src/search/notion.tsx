import NotionLogo from "@/components/icons/notion";
import { model } from "@/utils/ai";
import { TSession } from "@/utils/helpers";
import { Badge, Card } from "@radix-ui/themes";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { generateObject } from "ai";
import { generateState } from "arctic";
import z from "zod";
import { notion } from "../utils/auth";
import {
  ensureServerSession,
  getServerSession,
  setServerSession,
} from "../utils/server-session";

type NotionRichText = { plain_text?: string };

type NotionDatabase = {
  object: "database";
  id: string;
  title?: NotionRichText[];
  url?: string;
  last_edited_time?: string;
};

type NotionPage = {
  object: "page";
  id: string;
  properties?: Record<
    string,
    { type?: string; title?: NotionRichText[] } & Record<string, unknown>
  >;
  url?: string;
  last_edited_time?: string;
};

function extractTitle(result: NotionPage | NotionDatabase): string | undefined {
  if (result.object === "database") {
    const text = result.title ?? [];
    const title = text
      .map((t) => t.plain_text ?? "")
      .join("")
      .trim();

    return title || undefined;
  }

  const props = result.properties ?? {};

  for (const key of Object.keys(props)) {
    const prop = props[key] as { type?: string; title?: NotionRichText[] };

    if (prop?.type === "title") {
      const title = (prop.title ?? [])
        .map((t) => t.plain_text ?? "")
        .join("")
        .trim();

      if (title) return title;
    }
  }
  return undefined;
}

const PROMPT = `
You are a helpful assistant. Your task is to generate parameters for a Notion API request. The request will be to the \`search\` endpoint, and it will be used to search for pages and databases in Notion.

The user will provide a query, and you will need to generate the parameters for the request which optimally fulfils the user's query.

Here are the parameters that you will generate, (note that you don't need to generate all of them, only the ones that are relevant to the user's query):
\`\`\`json
{
  "post": {
    "summary": "Search by title",
    "description": "",
    "operationId": "post-search",
    "requestBody": {
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "The text that the API compares page and database titles against."
              },
              "sort": {
                "type": "object",
                "description": "A set of criteria, \`direction\` and \`timestamp\` keys, that orders the results. The **only** supported timestamp value is \`\"last_edited_time\"\`. Supported \`direction\` values are \`\"ascending\"\` and \`\"descending\"\`. If \`sort\` is not provided, then the most recently edited results are returned first.",
                "properties": {
                  "direction": {
                    "type": "string",
                    "description": "The direction to sort. Possible values include \`ascending\` and \`descending\`."
                  },
                  "timestamp": {
                    "type": "string",
                    "description": "The name of the timestamp to sort against. Possible values include \`last_edited_time\`."
                  }
                }
              },
              "filter": {
                "type": "object",
                "description": "A set of criteria, \`value\` and \`property\` keys, that limits the results to either only pages or only databases. Possible \`value\` values are \`\"page\"\` or \`\"database\"\`. The only supported \`property\` value is \`\"object\"\`.",
                "properties": {
                  "value": {
                    "type": "string",
                    "description": "The value of the property to filter the results by.  Possible values for object type include \`page\` or \`database\`.  **Limitation**: Currently the only filter allowed is \`object\` which will filter by type of object (either \`page\` or \`database\`)"
                  },
                  "property": {
                    "type": "string",
                    "description": "The name of the property to filter by. Currently the only property you can filter by is the object type.  Possible values include \`object\`.   Limitation: Currently the only filter allowed is \`object\` which will filter by type of object (either \`page\` or \`database\`)"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
\`\`\`
`;

const SCHEMA = z.object({
  query: z.string().optional(),
  page_size: z.number().min(1).max(100).default(10).optional(),
  sort: z
    .object({
      direction: z.enum(["ascending", "descending"]).default("descending"),
      timestamp: z.enum(["last_edited_time"]).default("last_edited_time"),
    })
    .optional(),
  filter: z
    .object({
      value: z.enum(["page", "database"]).default("page"),
      property: z.enum(["object"]).default("object"),
    })
    .optional(),
});

const generateAiEnhancedQueryParametersFn = createServerFn()
  .validator(
    z.object({
      query: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { object } = await generateObject({
      model,
      system: PROMPT,
      prompt: data.query,
      schema: SCHEMA,
    });

    return object;
  });

export const notionLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const url = notion.createAuthorizationURL(state);

  setCookie("notion_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  throw redirect({
    statusCode: 302,
    href: url.toString(),
  });
});

export const unlinkNotionFn = createServerFn().handler(async () => {
  const session = getServerSession() ?? ensureServerSession();
  setServerSession({
    ...session,
    notionUsername: null,
    notionAccessToken: null,
  });
  return true;
});

export async function notionSearch({
  session,
  query,
  signal,
  aiEnhanced,
}: {
  session: TSession;
  query: string;
  signal: AbortSignal;
  aiEnhanced: boolean;
}) {
  const accessToken = session.notionAccessToken;
  if (!accessToken) return { data: null, error: new Error("No access token") };

  let queryParameters: z.output<typeof SCHEMA> | undefined = undefined;

  if (aiEnhanced) {
    const object = await generateAiEnhancedQueryParametersFn({
      data: { query },
    });

    queryParameters = object;
  } else {
    queryParameters = {
      query,
      page_size: 10,
      sort: { direction: "descending", timestamp: "last_edited_time" },
    };
  }

  try {
    const response = await fetch("/notion", {
      method: "POST",
      body: JSON.stringify({ ...queryParameters, accessToken }),
      signal,
    });

    if (!response.ok) {
      return {
        data: null,
        error: new Error(response.statusText),
      };
    }

    const data = (await response.json()) as {
      results: Array<NotionPage | NotionDatabase>;
    };

    return {
      error: null,
      data: (data.results ?? []).map((item) => {
        const title = extractTitle(item as any) ?? "Untitled";
        const kind = (item as any).object === "database" ? "Database" : "Page";
        const lastEditedISO = (item as any).last_edited_time;
        const lastEditedText = lastEditedISO
          ? new Date(lastEditedISO).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined;

        return (
          <Card
            key={(item as any).id}
            size="3"
            className="hover:bg-grayA-2 hover:shadow-[inset_0_0_0_1px_var(--gray-a8)]"
            asChild
          >
            <a
              href={(item as any).url ?? undefined}
              target="_blank"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <NotionLogo className="size-4" />
                <p className="text-2 text-gray-10 font-medium">Notion</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-4 font-medium">{title}</p>
                <Badge color="gray" variant="surface">
                  {kind}
                </Badge>
              </div>
              {lastEditedText ? (
                <div className="text-2 text-gray-10 mt-2">
                  <span>Updated {lastEditedText}</span>
                </div>
              ) : null}
            </a>
          </Card>
        );
      }),
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Unknown error occurred"),
    };
  }
}
