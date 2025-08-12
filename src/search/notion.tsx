import NotionLogo from "@/components/icons/notion";
import type { getSessionFn } from "@/utils/server-functions";
import { Badge, Card } from "@radix-ui/themes";
import { JSX } from "react";

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

export default async function notionSearch(
  session: NonNullable<Awaited<ReturnType<typeof getSessionFn>>>,
  query: string,
  signal: AbortSignal,
): Promise<
  { data: JSX.Element[]; error: null } | { data: null; error: Error }
> {
  const accessToken = session.notionAccessToken;
  if (!accessToken) return { data: null, error: new Error("No access token") };

  try {
    const response = await fetch("/notion/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        page_size: 10,
        sort: { direction: "descending", timestamp: "last_edited_time" },
      }),
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
