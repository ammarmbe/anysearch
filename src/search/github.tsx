import GithubLogo from "@/components/icons/github";
import type { getSessionFn } from "@/utils/server-functions";
import { request } from "@octokit/request";
import { Badge, Card } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { LucideStar } from "lucide-react";

export default async function githubSearch(
  session: NonNullable<Awaited<ReturnType<typeof getSessionFn>>>,
  query: string,
  signal: AbortSignal,
) {
  const { data } = await request("GET /search/repositories", {
    q: `${query} user:${session.githubUsername} is:private`,
    per_page: 10,
    headers: {
      Authorization: `Bearer ${session.githubAccessToken}`,
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
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
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
