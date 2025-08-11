import GmailLogo from "@/components/icons/gmail";
import { getGmailAccessTokenFn } from "@/utils/server-functions";
import { Badge, Card } from "@radix-ui/themes";
import { LucideStar } from "lucide-react";

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

export default async function gmailSearch(query: string, signal: AbortSignal) {
  const accessToken = await getGmailAccessTokenFn();
  if (!accessToken) return [];

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
      `subject:${query} OR from:${query} OR to:${query}`,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    },
  );

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

  return threadData?.map((item) => {
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
  });
}
