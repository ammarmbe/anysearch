import { GithubLogo } from "@/components/icons/github";
import { Card } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { authClient } from "../utils/auth/client";

export async function GoogleDriveSearch(query: string, signal: AbortSignal) {
  const { data: accessToken, error: accessTokenError } =
    await authClient.getAccessToken({
      providerId: "google",
    });

  if (accessTokenError) {
    throw new Error(accessTokenError?.message);
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name contains '${query}'`)}&fields=${encodeURIComponent("files(id, name, description, webViewLink)")}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken.accessToken}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Google Drive API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    files: {
      id: string;
      name: string;
      description: string;
      webViewLink: string;
    }[];
  };

  return data.files?.map((item) => (
    <Card
      key={item.id}
      size="3"
      className="hover:bg-grayA-2 hover:shadow-[inset_0_0_0_1px_var(--gray-a8)]"
      asChild
    >
      <Link to={item.webViewLink ?? undefined}>
        <div className="flex items-center gap-2">
          <GithubLogo className="size-4" />
          <p className="text-2 text-gray-10 font-medium">GitHub</p>
        </div>
        <p className="text-4 mt-2 font-medium">{item.name}</p>
        <p
          className="text-3 text-gray-10 mt-2 line-clamp-3"
          title={item.description ?? ""}
        >
          {item.description}
        </p>
      </Link>
    </Card>
  ));
}
