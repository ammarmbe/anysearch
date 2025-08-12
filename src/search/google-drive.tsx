import GoogleDriveLogo from "@/components/icons/google-drive";
import { model } from "@/utils/ai";
import { Badge, Card } from "@radix-ui/themes";
import { Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { generateObject } from "ai";
import { generateCodeVerifier, generateState } from "arctic";
import {
  LucideFile,
  LucideFileArchive,
  LucideFileAudio,
  LucideFileCode,
  LucideFileImage,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideFileVideo,
  LucideFolder,
  LucideStar,
} from "lucide-react";
import { type ReactNode } from "react";
import { z } from "zod";
import { getSession, google } from "../utils/auth";
import db from "../utils/db";

function formatFileSize(byteString?: string) {
  if (!byteString) return undefined;
  const bytes = Number(byteString);
  if (!Number.isFinite(bytes) || bytes <= 0) return undefined;
  const units = ["B", "KB", "MB", "GB", "TB"]; // good enough for UI
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function getMimeMeta(mimeType?: string): { label: string; icon: ReactNode } {
  const fallback = {
    label: "File",
    icon: <LucideFile className="size-[0.9rem]" />,
  };
  if (!mimeType) return fallback;

  // Google Workspace types
  if (mimeType === "application/vnd.google-apps.folder") {
    return {
      label: "Folder",
      icon: <LucideFolder className="size-[0.9rem]" />,
    };
  }
  if (mimeType === "application/vnd.google-apps.document") {
    return {
      label: "Google Docs",
      icon: <LucideFileText className="size-[0.9rem]" />,
    };
  }
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return {
      label: "Google Sheets",
      icon: <LucideFileSpreadsheet className="size-[0.9rem]" />,
    };
  }
  if (mimeType === "application/vnd.google-apps.presentation") {
    return {
      label: "Google Slides",
      icon: <LucideFileText className="size-[0.9rem]" />,
    };
  }

  // Common binary types
  if (mimeType === "application/pdf") {
    return { label: "PDF", icon: <LucideFileText className="size-[0.9rem]" /> };
  }
  if (mimeType.startsWith("image/")) {
    return {
      label: "Image",
      icon: <LucideFileImage className="size-[0.9rem]" />,
    };
  }
  if (mimeType.startsWith("video/")) {
    return {
      label: "Video",
      icon: <LucideFileVideo className="size-[0.9rem]" />,
    };
  }
  if (mimeType.startsWith("audio/")) {
    return {
      label: "Audio",
      icon: <LucideFileAudio className="size-[0.9rem]" />,
    };
  }
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/x-compressed" ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip")
  ) {
    return {
      label: "Archive",
      icon: <LucideFileArchive className="size-[0.9rem]" />,
    };
  }
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("typescript") ||
    mimeType.includes("xml") ||
    mimeType.includes("yaml") ||
    mimeType.includes("x-sh") ||
    mimeType.startsWith("text/")
  ) {
    return {
      label: "Text",
      icon: <LucideFileCode className="size-[0.9rem]" />,
    };
  }

  return fallback;
}

const PROMPT = `
You are a helpful assistant. Your task is to generate parameters for a Google Drive API request. The request will be to the \`files.list\` endpoint, and it will be used to search for files in Google Drive.

The user will provide a query, and you will need to generate the parameters for the request which optimally fulfils the user's query.

Here are the parameters that you will generate, (note that you don't need to generate all of them, only the ones that are relevant to the user's query):
| Parameter | Type | Description |
|-----------|------|-------------|
| corpora | string | Bodies of items (files/documents) to which the query applies. Supported bodies are 'user', 'domain', 'drive', and 'allDrives'. Prefer 'user' or 'drive' to 'allDrives' for efficiency. By default, corpora is set to 'user'. However, this can change depending on the filter set through the 'q' parameter. |
| driveId | string | ID of the shared drive to search. |
| includeItemsFromAllDrives | boolean | Whether both My Drive and shared drive items should be included in results. |
| orderBy | string | A comma-separated list of sort keys. Valid keys are: <ul><li>\`createdTime\`: When the file was created.</li><li>\`folder\`: The folder ID. This field is sorted using alphabetical ordering.</li><li>\`modifiedByMeTime\`: The last time the file was modified by the user.</li><li>\`modifiedTime\`: The last time the file was modified by anyone.</li><li>\`name\`: The name of the file. This field is sorted using alphabetical ordering, so 1, 12, 2, 22.</li><li>\`name_natural\`: The name of the file. This field is sorted using natural sort ordering, so 1, 2, 12, 22.</li><li>\`quotaBytesUsed\`: The number of storage quota bytes used by the file.</li><li>\`recency\`: The most recent timestamp from the file's date-time fields.</li><li>\`sharedWithMeTime\`: When the file was shared with the user, if applicable.</li><li>\`starred\`: Whether the user has starred the file.</li><li>\`viewedByMeTime\`: The last time the file was viewed by the user.</li></ul> Example usage: \`?orderBy=folder,modifiedTime desc,name\`. |
| pageSize | integer | The maximum number of files to return per page. Partial or empty result pages are possible even before the end of the files list has been reached. |
| pageToken | string | The token for continuing a previous list request on the next page. This should be set to the value of 'nextPageToken' from the previous response. |
| q | string | A query for filtering the file results. |
| spaces | string | A comma-separated list of spaces to query within the corpora. Supported values are 'drive' and 'appDataFolder'. |
| supportsAllDrives | boolean | Whether the requesting application supports both My Drives and shared drives. |
| includePermissionsForView | string | Specifies which additional view's permissions to include in the response. Only 'published' is supported. |
| includeLabels | string | A comma-separated list of IDs of labels to include in the \`labelInfo\` part of the response. |

A query string contains the following three parts:

\`query_term operator values\`

Where:

\`query_term\` is the query term or field to search upon.

\`operator\` specifies the condition for the query term.

\`values\` are the specific values you want to use to filter your search results.

For example, the following query string filters the search to only return folders by setting the MIME type:

\`q: mimeType = 'application/vnd.google-apps.folder'\`

You must also escape special characters in your file names to make sure the query works correctly. For example, if a filename contains both an apostrophe (') and a backslash (\\) character, use a backslash to escape them: \`name contains 'quinn's paper\\essay'\`.

Here is the table of query terms and operators:
| Query term | Valid operators | Usage |
|------------|-----------------|-------|
| name | \`contains\`, \`=\`, \`!=\` | Name of the file. Surround with single quotes ('). Escape single quotes in queries with \', such as 'Valentine\'s Day'. |
| fullText | \`contains\` | Whether the name, description, indexableText properties, or text in the file's content or metadata of the file matches. Surround with single quotes ('). Escape single quotes in queries with \', such as 'Valentine\'s Day'. |
| mimeType | \`contains\`, \`=\`, \`!=\` | MIME type of the file. Surround with single quotes ('). Escape single quotes in queries with \', such as 'Valentine\'s Day'. For further information on MIME types, see Google Workspace and Google Drive supported MIME types. |
| modifiedTime | \`<=\`, \`<\`, \`=\`, \`!=\`, \`>\`, \`>=\` | Date of the last file modification. RFC 3339 format, default time zone is UTC, such as 2012-06-04T12:00:00-08:00. Fields of type date
| viewedByMeTime | \`<=\`, \`<\`, \`=\`, \`!=\`, \`>\`, \`>=\` | Date that the user last viewed a file. RFC 3339 format, default time zone is UTC, such as 2012-06-04T12:00:00-08:00. Fields of type date are not comparable to each other, only to constant dates. |
| trashed | \`=\`, \`!=\` | Whether the file is in the trash or not. Can be either true or false. |
| starred | \`=\`, \`!=\` | Whether the file is starred or not. Can be either true or false. |
| parents | \`in\` | Whether the parents collection contains the specified ID. |
| owners | \`in\` | Users who own the file. |
| writers | \`in\` | Users or groups who have permission to modify the file. See the permissions resource reference. |
| readers | \`in\` | Users or groups who have permission to read the file. See the permissions resource reference. |
| sharedWithMe | \`=\`, \`!=\` | Files that are in the user's "Shared with me" collection. All file users are in the file's Access Control List (ACL). Can be either true or false. |
| createdTime | \`<=\`, \`<\`, \`=\`, \`!=\`, \`>\`, \`>=\` | Date when the file was created. Use RFC 3339 format, default time zone is UTC, such as 2012-06-04T12:00:00-08:00. |
| properties | \`has\` | Public custom file properties. |
| appProperties | \`has\` | Private custom file properties. |
| visibility | \`=\`, \`!=\` | The visibility level of the file. Valid values are anyoneCanFind, anyoneWithLink, domainCanFind, domainWithLink, and limited. Surround with single quotes ('). |
| shortcutDetails.targetId | \`=\`, \`!=\` | The ID of the item the shortcut points to. |

Here are some examples of queries:
| What you want to query | Example |
|------------------------|---------|
| Files with the name "hello" | name = 'hello' |
| Files with a name containing the words "hello" and "goodbye" | name contains 'hello' and name contains 'goodbye' |
| Files with a name that does not contain the word "hello" | not name contains 'hello' |
| Files that contain the text "important" and in the trash | fullText contains 'important' and trashed = true |
| Files that contain the word "hello" | fullText contains 'hello' |
| Files that don't have the word "hello" | not fullText contains 'hello' |
| Files that contain the exact phrase "hello world" | fullText contains '"hello world"' |
| Files with a query that contains the "\" character (for example, "\authors") | fullText contains '\\authors' |
| Files that are folders | mimeType = 'application/vnd.google-apps.folder' |
| Files that are not folders | mimeType != 'application/vnd.google-apps.folder' |
| Files modified after a given date (default time zone is UTC) | modifiedTime > '2012-06-04T12:00:00' |
| Image or video files modified after a specific date | modifiedTime > '2012-06-04T12:00:00' and (mimeType contains 'image/' or mimeType contains 'video/') |
| Files that are starred | starred = true |
| Files within a collection (for example, the folder ID in the parents collection) | '1234567' in parents |
| Files in an application data folder in a collection | 'appDataFolder' in parents |
| Files for which user "test@example.org" is the owner | 'test@example.org' in owners |
| Files for which user "test@example.org" has write permission | 'test@example.org' in writers |
| Files for which members of the group "group@example.org" have write permission | 'group@example.org' in writers |
| Files shared with the authorized user with "hello" in the name | sharedWithMe and name contains 'hello' |
| Files with a custom file property visible to all apps | properties has { key='mass' and value='1.3kg' } |
| Files with a custom file property private to the requesting app | appProperties has { key='additionalID' and value='8e8aceg2af2ge72e78' } |
| Files that have not been shared with anyone or domains (only private, or shared with specific users or groups) | visibility = 'limited' |
`;

const SCHEMA = z.object({
  corpora: z.string().optional(),
  driveId: z.string().optional(),
  includeItemsFromAllDrives: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
  orderBy: z.string().optional(),
  pageSize: z
    .number()
    .transform((val) => val?.toString())
    .optional(),
  pageToken: z.string().optional(),
  q: z.string().optional(),
  spaces: z.string().optional(),
  supportsAllDrives: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
  includePermissionsForView: z.string().optional(),
  includeLabels: z.string().optional(),
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

export const googleDriveLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.readonly",
  ]);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  setCookie("google_integration", "drive", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  setCookie("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  setCookie("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  throw redirect({
    statusCode: 302,
    href: url.toString(),
  });
});

export const getGoogleDriveAccessTokenFn = createServerFn().handler(
  async () => {
    const sessionId = getCookie("session")?.split(".")[0];
    if (!sessionId) return null;

    const session = await getSession(sessionId);
    if (!session) return null;

    const now = Date.now();
    const skewMs = 60_000; // 60s clock skew buffer

    if (
      session.googleDriveAccessToken &&
      session.googleDriveAccessTokenExpiresAt &&
      session.googleDriveAccessTokenExpiresAt.getTime() - skewMs > now
    ) {
      return session.googleDriveAccessToken;
    }

    if (!session.googleDriveRefreshToken) {
      return null;
    }

    try {
      const tokens = await google.refreshAccessToken(
        session.googleDriveRefreshToken,
      );
      const newAccessToken = tokens.accessToken();
      const accessTokenExpiresAt = tokens.accessTokenExpiresAt() ?? undefined;

      const refreshTokenFromProvider = tokens.hasRefreshToken()
        ? tokens.refreshToken()
        : undefined;
      const refreshToken =
        refreshTokenFromProvider ?? session.googleDriveRefreshToken;

      const refreshTokenExpiresIn =
        "refresh_token_expires_in" in tokens.data &&
        typeof (tokens.data as any).refresh_token_expires_in === "number"
          ? Number((tokens.data as any).refresh_token_expires_in)
          : undefined;

      await db.session.update({
        where: { id: session.id },
        data: {
          googleDriveAccessToken: newAccessToken,
          googleDriveAccessTokenExpiresAt: accessTokenExpiresAt,
          googleDriveRefreshToken: refreshToken,
          googleDriveRefreshTokenExpiresAt: refreshTokenExpiresIn
            ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
            : (session.googleDriveRefreshTokenExpiresAt ?? undefined),
        },
      });

      return newAccessToken;
    } catch {
      return null;
    }
  },
);

export const unlinkGoogleDriveFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      googleDriveUsername: null,
      googleDriveAccessToken: null,
      googleDriveAccessTokenExpiresAt: null,
      googleDriveRefreshToken: null,
      googleDriveRefreshTokenExpiresAt: null,
    },
  });

  return true;
});

export async function googleDriveSearch({
  query,
  signal,
  aiEnhanced,
}: {
  query: string;
  signal: AbortSignal;
  aiEnhanced: boolean;
}) {
  const accessToken = await getGoogleDriveAccessTokenFn();
  if (!accessToken) return { data: null, error: new Error("No access token") };

  let queryParameters: z.output<typeof SCHEMA> | undefined = undefined;

  if (aiEnhanced) {
    const object = await generateAiEnhancedQueryParametersFn({
      data: { query },
    });

    queryParameters = object;
  } else {
    queryParameters = {
      q: `name contains '${query}' and trashed = false`,
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true",
      spaces: "drive",
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${new URLSearchParams(queryParameters).toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal,
      },
    );

    if (!response.ok) {
      return {
        data: null,
        error: new Error(response.statusText),
      };
    }

    const data = (await response.json()) as {
      files: Array<{
        id: string;
        name: string;
        description?: string;
        webViewLink?: string;
        mimeType?: string;
        modifiedTime?: string; // RFC 3339 per Drive API
        size?: string; // returned as string
        starred?: boolean;
      }>;
    };

    return {
      error: null,
      data: data.files?.map((item) => {
        const sizeText = formatFileSize(item.size);
        const modifiedText = item.modifiedTime
          ? new Date(item.modifiedTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined;
        const mimeMeta = getMimeMeta(item.mimeType);

        return (
          <Card
            key={item.id}
            size="3"
            className="hover:bg-grayA-2 hover:shadow-[inset_0_0_0_1px_var(--gray-a8)]"
            asChild
          >
            <Link to={item.webViewLink ?? undefined}>
              <div className="flex items-center gap-2">
                <GoogleDriveLogo className="size-4" />
                <p className="text-2 text-gray-10 font-medium">Google Drive</p>
                {item.starred ? (
                  <LucideStar className="text-amber-9 fill-amber-9 size-[0.75rem]" />
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-4 font-medium">{item.name}</p>
                <Badge
                  className="flex items-center gap-1"
                  color="gray"
                  variant="surface"
                >
                  {mimeMeta.icon}
                  {mimeMeta.label}
                </Badge>
              </div>
              <div className="text-2 text-gray-10 mt-2 flex flex-wrap items-center gap-2">
                {modifiedText ? <span>Updated {modifiedText}</span> : null}
                {modifiedText && sizeText ? <span>·</span> : null}
                {sizeText ? <span>{sizeText}</span> : null}
              </div>
              {item.description ? (
                <p
                  className="text-3 text-gray-10 mt-2 line-clamp-3"
                  title={item.description}
                >
                  {item.description}
                </p>
              ) : null}
            </Link>
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
