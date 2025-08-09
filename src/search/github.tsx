import { GithubLogo } from "@/components/icons/github";
import { request } from "@octokit/request";
import { Badge, Card } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { LucideStar } from "lucide-react";
import { authClient } from "../utils/auth/client";

export async function githubSearch(query: string, signal: AbortSignal) {
  const { data: accessToken, error: accessTokenError } =
    await authClient.getAccessToken({
      providerId: "github",
    });
  const { data: session, error: sessionError } = await authClient.getSession();

  if (accessTokenError || sessionError) {
    throw new Error(accessTokenError?.message ?? sessionError?.message);
  }

  const githubUsername = session?.user.githubUsername;

  const { data } = await request("GET /search/repositories", {
    q: `${query} user:${githubUsername}`,
    per_page: 10,
    headers: {
      Authorization: `Bearer ${accessToken.accessToken}`,
    },
    signal,
  });

  return data.items.map((item) => (
    <Card
      key={item.id}
      size="3"
      className="hover:bg-grayA-2 hover:shadow-[inset_0_0_0_1px_var(--gray-a8)]"
      asChild
    >
      <Link to={item.html_url}>
        <div className="flex items-center gap-2">
          <GithubLogo className="size-4" />
          <p className="text-2 text-gray-10 font-medium">GitHub</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-4 font-medium">{item.full_name}</p>
          <Badge
            className="flex items-center gap-1"
            color="gray"
            variant="surface"
          >
            <LucideStar className="text-amber-9 fill-amber-9 size-[0.75rem]" />
            {new Intl.NumberFormat("en-US", {
              notation: "compact",
            }).format(item.stargazers_count)}
          </Badge>
        </div>
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
