import GmailLogo from "@/components/icons/gmail";
import { model } from "@/utils/ai";
import { Badge, Card } from "@radix-ui/themes";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { generateObject } from "ai";
import { generateCodeVerifier, generateState } from "arctic";
import { LucideStar } from "lucide-react";
import { z } from "zod";
import { google } from "../utils/auth";
import {
  ensureServerSession,
  getServerSession,
  setServerSession,
} from "../utils/server-session";

type TMessage = {
  /**
   * The ID of the last history record that modified this message.
   */
  historyId?: string | null;
  /**
   * The immutable ID of the message.
   */
  id?: string | null;
  /**
   * The internal message creation timestamp (epoch ms), which determines ordering in the inbox. For normal SMTP-received email, this represents the time the message was originally accepted by Google, which is more reliable than the `Date` header. However, for API-migrated mail, it can be configured by client to be based on the `Date` header.
   */
  internalDate?: string | null;
  /**
   * List of IDs of labels applied to this message.
   */
  labelIds?: string[] | null;
  /**
   * The parsed email structure in the message parts.
   */
  payload?: TMessagePart;
  /**
   * The entire email message in an RFC 2822 formatted and base64url encoded string. Returned in `messages.get` and `drafts.get` responses when the `format=RAW` parameter is supplied.
   */
  raw?: string | null;
  /**
   * Estimated size in bytes of the message.
   */
  sizeEstimate?: number | null;
  /**
   * A short part of the message text.
   */
  snippet?: string | null;
  /**
   * The ID of the thread the message belongs to. To add a message or draft to a thread, the following criteria must be met: 1. The requested `threadId` must be specified on the `Message` or `Draft.Message` you supply with your request. 2. The `References` and `In-Reply-To` headers must be set in compliance with the [RFC 2822](https://tools.ietf.org/html/rfc2822) standard. 3. The `Subject` headers must match.
   */
  threadId?: string | null;
};
/**
 * A single MIME message part.
 */
type TMessagePart = {
  /**
   * The message part body for this part, which may be empty for container MIME message parts.
   */
  body?: TMessagePartBody;
  /**
   * The filename of the attachment. Only present if this message part represents an attachment.
   */
  filename?: string | null;
  /**
   * List of headers on this message part. For the top-level message part, representing the entire message payload, it will contain the standard RFC 2822 email headers such as `To`, `From`, and `Subject`.
   */
  headers?: TMessagePartHeader[];
  /**
   * The MIME type of the message part.
   */
  mimeType?: string | null;
  /**
   * The immutable ID of the message part.
   */
  partId?: string | null;
  /**
   * The child MIME message parts of this part. This only applies to container MIME message parts, for example `multipart/x`. For non- container MIME message part types, such as `text/plain`, this field is empty. For more information, see RFC 1521.
   */
  parts?: TMessagePart[];
};
/**
 * The body of a single MIME message part.
 */
type TMessagePartBody = {
  /**
   * When present, contains the ID of an external attachment that can be retrieved in a separate `messages.attachments.get` request. When not present, the entire content of the message part body is contained in the data field.
   */
  attachmentId?: string | null;
  /**
   * The body data of a MIME message part as a base64url encoded string. May be empty for MIME container types that have no message body or when the body data is sent as a separate attachment. An attachment ID is present if the body data is contained in a separate attachment.
   */
  data?: string | null;
  /**
   * Number of bytes for the message part data (encoding notwithstanding).
   */
  size?: number | null;
};
type TMessagePartHeader = {
  /**
   * The name of the header before the `:` separator. For example, `To`.
   */
  name?: string | null;
  /**
   * The value of the header after the `:` separator. For example, `someuser@example.com`.
   */
  value?: string | null;
};

const PROMPT = `
You are a helpful assistant. Your task is to generate parameters for a Gmail API request. The request will be to the \`users.messages.list\` endpoint, and it will be used to search for messages in Gmail.

The user will provide a query, and you will need to generate the parameters for the request which optimally fulfils the user's query.

Here are the parameters that you will generate, (note that you don't need to generate all of them, only the ones that are relevant to the user's query):
| Parameter | Type | Description | 
| --- | --- | --- |
| maxResults | integer (uint32 format) | Maximum number of messages to return. This field defaults to 100. The maximum allowed value for this field is 500. | 
| pageToken | string | Page token to retrieve a specific page of results in the list. | 
| q | string | Only return messages matching the specified query. Supports the same query format as the Gmail search box. For example, "from:someuser@example.com rfc822msgid:<somemsgid@example.com> is:unread". Parameter cannot be used when accessing the api using the gmail.metadata scope. | 
| labelIds[] | string | Only return messages with labels that match all of the specified label IDs. Messages in a thread might have labels that other messages in the same thread don't have. To learn more, see Manage labels on messages and threads. | 
| includeSpamTrash | boolean | Include messages from SPAM and TRASH in the results. | 

Here is the query format for the Gmail search box:
| Search operator | Description | Example | 
| --- | --- | --- | 
| from: | Find emails sent from a specific person. | from:me<br>from:amy@example.com | 
| to: | Find emails sent to a specific person. | to:me<br>to:john@example.com | 
| cc:<br>bcc: | Find emails that include specific people in the "Cc" or "Bcc" fields. | cc:john@example.com<br>bcc:david@example.com | 
| subject: | Find emails by a word or phrase in the subject line. | subject:dinner<br>subject:anniversary party | 
| after:<br>before:<br>older:<br>newer: | Search for emails received during a certain time period. | after:2004/04/16<br>after:04/16/2004<br>before:2004/04/18<br>before:04/18/2004 | 
| older_than:<br>newer_than: | Search for emails older or newer than a time period. Use d (day), m (month), or y (year). | older_than:1y<br>newer_than:2d | 
| OR or { } | Find emails that match one or more of your search criteria. | from:amy OR from:david<br>{from:amy from:david} | 
| AND | Find emails that match all of your search criteria. | from:amy AND to:david | 
| - | Exclude emails from your search criteria. | dinner -movie | 
| AROUND | Find emails with words near each other. Use the number to say how many words apart the words can be.<br>Add quotes to find messages in which the word you put first stays first. | holiday AROUND 10 vacation<br>"secret AROUND 25 birthday" | 
| label: | Find emails under one of your labels. | label:friends<br>label:important | 
| category: | If you use inbox categories, find emails under one of the categories. | category:primary<br>category:social<br>category:promotions<br>category:updates<br>category:forums<br>category:reservations<br>category:purchases | 
| has: | Find emails that include:<br>Attachments<br>Inline images<br>YouTube videos<br>Drive files<br>Google Docs<br>Google Sheets<br>Google Slides | has:attachment<br>has:youtube<br>has:drive<br>has:document<br>has:spreadsheet<br>has:presentation | 
| list: | Find emails from a mailing list. | list:info@example.com | 
| filename: | Find emails that have attachments with a certain name or file type. | filename:pdf<br>filename:homework.txt | 
| " " | Search for emails with an exact word or phrase. | "dinner and movie tonight" | 
| ( ) | Group multiple search terms together. | subject:(dinner movie) | 
| in:anywhere | Find emails across Gmail. This includes emails in Spam and Trash. | in:anywhere movie | 
| in:snoozed | Find emails that you snoozed. | in:snoozed birthday reminder | 
| is:muted | Find emails that you muted. | is:muted subject:team celebration | 
| is: | Search for emails by their status:<br>Important<br>Starred<br>Unread<br>Read | is:important<br>is:starred<br>is:unread<br>is:read | 
| has:yellow-star<br>has:orange-star<br>has:red-star<br>has:purple-star<br>has:blue-star<br>has:green-star<br>has:red-bang<br>has:orange-guillemet<br>has:yellow-bang<br>has:green-check<br>has:blue-info<br>has:purple-question | If you set up different star options, you can search for emails under a star option. Learn how to star emails in Gmail. | has:yellow-star OR has:purple-question | 
| deliveredto: | Find emails delivered to a specific email address. | deliveredto:username@example.com | 
| size:<br>larger:<br>smaller: | Find emails by their size. | size:1000000<br>larger:10M | 
| + | Find emails that match a word exactly. | +unicorn | 
| rfc822msgid | Find emails with a specific message-id header. | rfc822msgid:200503292@example.com | 
| has:userlabels<br>has:nouserlabels | Find emails that have or don't have a label. Labels are only added to a message, and not an entire conversation. | has:userlabels<br>has:nouserlabels |
`;

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

const SCHEMA = z.object({
  maxResults: z
    .number()
    .transform((val) => val.toString())
    .optional(),
  pageToken: z.string().optional(),
  q: z.string().optional(),
  labelIds: z
    .array(z.string())
    .transform((val) => val.join(","))
    .optional(),
  includeSpamTrash: z.union([z.literal("true"), z.literal("false")]).optional(),
});

export const gmailLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.readonly",
  ]);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  setCookie("google_integration", "gmail", {
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

export const getGmailAccessTokenFn = createServerFn().handler(async () => {
  const session = getServerSession() ?? ensureServerSession();
  const now = Date.now();
  const skewMs = 60_000;

  if (
    session.gmailAccessToken &&
    session.gmailAccessTokenExpiresAt &&
    new Date(session.gmailAccessTokenExpiresAt).getTime() - skewMs > now
  ) {
    return session.gmailAccessToken;
  }

  if (!session.gmailRefreshToken) {
    return null;
  }

  try {
    const tokens = await google.refreshAccessToken(session.gmailRefreshToken);
    const newAccessToken = tokens.accessToken();
    const accessTokenExpiresAt = tokens.accessTokenExpiresAt() ?? undefined;

    const refreshTokenFromProvider = tokens.hasRefreshToken()
      ? tokens.refreshToken()
      : undefined;
    const refreshToken = refreshTokenFromProvider ?? session.gmailRefreshToken;

    const refreshTokenExpiresIn =
      "refresh_token_expires_in" in tokens.data &&
      typeof (tokens.data as any).refresh_token_expires_in === "number"
        ? Number((tokens.data as any).refresh_token_expires_in)
        : undefined;

    setServerSession({
      ...session,
      gmailAccessToken: newAccessToken,
      gmailAccessTokenExpiresAt: accessTokenExpiresAt
        ? accessTokenExpiresAt.toISOString()
        : session.gmailAccessTokenExpiresAt,
      gmailRefreshToken: refreshToken,
      gmailRefreshTokenExpiresAt: refreshTokenExpiresIn
        ? new Date(Date.now() + refreshTokenExpiresIn * 1000).toISOString()
        : session.gmailRefreshTokenExpiresAt,
    });

    return newAccessToken;
  } catch {
    return null;
  }
});

export const unlinkGmailFn = createServerFn().handler(async () => {
  const session = getServerSession() ?? ensureServerSession();
  setServerSession({
    ...session,
    gmailUsername: null,
    gmailAccessToken: null,
    gmailAccessTokenExpiresAt: null,
    gmailRefreshToken: null,
    gmailRefreshTokenExpiresAt: null,
  });
  return true;
});

export async function gmailSearch({
  query,
  signal,
  aiEnhanced,
}: {
  query: string;
  signal: AbortSignal;
  aiEnhanced: boolean;
}) {
  const accessToken = await getGmailAccessTokenFn();
  if (!accessToken) return { data: null, error: new Error("No access token") };

  let queryParameters: z.output<typeof SCHEMA> | undefined = undefined;

  if (aiEnhanced) {
    const object = await generateAiEnhancedQueryParametersFn({
      data: { query },
    });

    queryParameters = object;
  } else {
    queryParameters = {
      q: `subject:${query} OR from:${query} OR to:${query}`,
    };
  }

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${new URLSearchParams(queryParameters).toString()}`,
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
      messages: Array<{
        id: string;
        threadId: string;
      }>;
    };

    const threadData = await Promise.all(
      data.messages?.map(async (message) => {
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal,
          },
        );

        return (await response.json()) as TMessage;
      }) || [],
    );

    return {
      error: null,
      data: threadData?.map((item) => {
        const subject = item.payload?.headers?.find(
          (header) => header.name === "Subject",
        )?.value;
        const from = item.payload?.headers
          ?.find((header) => header.name === "From")
          ?.value?.split("<")[0];
        const dateText = item.internalDate
          ? new Date(Number(item.internalDate)).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined;

        const isStarred = item.labelIds?.includes("STARRED");
        const labelBadges = (item.labelIds ?? [])
          .filter((l) => ["INBOX", "IMPORTANT", "SENT"].includes(l))
          .slice(0, 2);

        return (
          <Card
            key={item.id}
            size="3"
            className="hover:bg-grayA-2 hover:shadow-[inset_0_0_0_1px_var(--gray-a8)]"
            asChild
          >
            <a
              href={`https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(item.id ?? "")}`}
            >
              <div className="flex items-center gap-2">
                <GmailLogo className="size-4" />
                <p className="text-2 text-gray-10 font-medium">Gmail</p>
                {isStarred ? (
                  <LucideStar className="text-amber-9 fill-amber-9 size-[0.75rem]" />
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-4 line-clamp-1 font-medium">{subject}</p>
                <div className="flex items-center gap-2">
                  {labelBadges.map((label) => (
                    <Badge key={label} color="gray" variant="surface">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-2 text-gray-10 mt-2 flex flex-wrap items-center gap-2">
                {from ? <p className="line-clamp-1">{from}</p> : null}
                {from && dateText ? <span>·</span> : null}
                {dateText ? <span>{dateText}</span> : null}
              </div>
              {item.snippet ? (
                <p
                  className="text-3 text-gray-10 mt-2 line-clamp-2"
                  title={item.snippet ?? undefined}
                >
                  {item.snippet}
                </p>
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
