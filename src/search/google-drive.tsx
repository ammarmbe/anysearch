import GoogleDriveLogo from "@/components/icons/google-drive";
import { getGoogleDriveAccessTokenFn } from "@/utils/server-functions";
import { Badge, Card } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
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
import { JSX, type ReactNode } from "react";

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

export default async function googleDriveSearch(
  query: string,
  signal: AbortSignal,
): Promise<
  { data: JSX.Element[]; error: null } | { data: null; error: Error }
> {
  const accessToken = await getGoogleDriveAccessTokenFn();
  if (!accessToken) return { data: null, error: new Error("No access token") };

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name contains '${query}' and trashed = false`,
      )}&includeItemsFromAllDrives=true&supportsAllDrives=true&spaces=drive&fields=${encodeURIComponent(
        "files(id,name,description,webViewLink,mimeType,modifiedTime,size,starred)",
      )}`,
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
