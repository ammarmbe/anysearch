import GithubLogo from "@/components/icons/github";
import { model } from "@/utils/ai";
import type { getSessionFn } from "@/utils/server-functions";
import { request } from "@octokit/request";
import { Badge, Card } from "@radix-ui/themes";
import { Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { generateObject } from "ai";
import { generateState } from "arctic";
import { LucideStar } from "lucide-react";
import z from "zod";
import { getSession, github } from "../utils/auth";
import db from "../utils/db";

const PROMPT = `
You are a helpful assistant. Your task is to generate parameters for a Google Drive API request. The request will be to the \`files.list\` endpoint, and it will be used to search for files in Google Drive.

The user will provide a query, and you will need to generate the parameters for the request which optimally fulfils the user's query.

Here are the parameters that you will generate, (note that you don't need to generate all of them, only the ones that are relevant to the user's query):
| Parameter | Type | Required | Description | Default | Possible Values |
|-----------|------|----------|-------------|---------|-----------------|
| q | string | Yes | The query contains one or more search keywords and qualifiers. Qualifiers allow you to limit your search to specific areas. | — | — |
| sort | string | No | Sorts the results of your query by a specific field. | best match | stars, forks, help-wanted-issues, updated |
| order | string | No | Determines whether the first search result returned is the highest number of matches (\`desc\`) or lowest number of matches (\`asc\`). This parameter is ignored unless you provide \`sort\`. | desc | desc, asc |
| per_page | integer | No | The number of results per page (max 100). | 30 | 1–100 |
| page | integer | No | The page number of the results to fetch. | 1 | 1+ |

A query can contain any combination of search qualifiers supported on GitHub. The format of the search query is:

\`\`\`
SEARCH_KEYWORD_1 SEARCH_KEYWORD_N QUALIFIER_1 QUALIFIER_N
\`\`\`

For example, if you wanted to search for all repositories that contained the word GitHub and Octocat in the README file, you would use the following query with the search repositories endpoint:

\`\`\`
GitHub Octocat in:readme
\`\`\`

You cannot use queries that:

Are longer than 256 characters (not including operators or qualifiers).
Have more than five AND, OR, or NOT operators.
These search queries will return a "Validation failed" error message.


### Search by repository name, description, or contents of the README file

With the \`in\` qualifier you can restrict your search to the repository name, repository description, repository topics, contents of the README file, or any combination of these. When you omit this qualifier, only the repository name, description, and topics are searched.

| Qualifier         | Example                                                      | Description                                                                                   |
|-------------------|-------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| in:name           | \`jquery in:name\`                                             | Matches repositories with "jquery" in the repository name.                                    |
| in:description    | \`jquery in:name,description\`                                 | Matches repositories with "jquery" in the repository name or description.                     |
| in:topics         | \`jquery in:topics\`                                           | Matches repositories labeled with "jquery" as a topic.                                        |
| in:readme         | \`jquery in:readme\`                                           | Matches repositories mentioning "jquery" in the repository's README file.                     |
| repo:owner/name   | \`repo:octocat/hello-world\`                                   | Matches a specific repository name.                                                           |

---

### Search based on the contents of a repository

You can find a repository by searching for content in the repository's README file using the \`in:readme\` qualifier. For more information, see About READMEs.

Besides using \`in:readme\`, it's not possible to find repositories by searching for specific content within the repository. To search for a specific file or content within a repository, you can use the file finder or code-specific search qualifiers.

| Qualifier   | Example                        | Description                                                                                   |
|-------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| in:readme   | \`octocat in:readme\`           | Matches repositories mentioning "octocat" in the repository's README file.                    |

---

### Search by repository size

The \`size\` qualifier finds repositories that match a certain size (in kilobytes), using greater than, less than, and range qualifiers.

| Qualifier   | Example                | Description                                                                                   |
|-------------|------------------------|-----------------------------------------------------------------------------------------------|
| size:n      | \`size:1000\`            | Matches repositories that are 1 MB exactly.                                                   |
| size:>n     | \`size:>=30000\`         | Matches repositories that are at least 30 MB.                                                 |
| size:<n     | \`size:<50\`             | Matches repositories that are smaller than 50 KB.                                             |
| size:n..n   | \`size:50..120\`         | Matches repositories that are between 50 KB and 120 KB.                                       |

---

### Search by number of followers

You can filter repositories based on the number of users who follow the repositories, using the \`followers\` qualifier.

| Qualifier        | Example                                         | Description                                                                                   |
|------------------|------------------------------------------------|-----------------------------------------------------------------------------------------------|
| followers:>=n    | \`node followers:>=10000\`                        | Matches repositories with 10,000 or more followers mentioning the word "node".                |
| followers:n..n   | \`styleguide linter followers:1..10\`             | Matches repositories with between 1 and 10 followers, mentioning the word "styleguide linter."|

---

### Search by number of forks

The \`forks\` qualifier specifies the number of forks a repository should have.

| Qualifier   | Example                | Description                                                                                   |
|-------------|------------------------|-----------------------------------------------------------------------------------------------|
| forks:n     | \`forks:5\`              | Matches repositories with only five forks.                                                    |
| forks:>n    | \`forks:>=205\`          | Matches repositories with at least 205 forks.                                                 |
| forks:<n    | \`forks:<90\`            | Matches repositories with fewer than 90 forks.                                                |
| forks:n..n  | \`forks:10..20\`         | Matches repositories with 10 to 20 forks.                                                     |

---

### Search by number of stars

You can search repositories based on the number of stars the repositories have.

| Qualifier                        | Example                                              | Description                                                                                   |
|----------------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| stars:n                          | \`stars:500\`                                          | Matches repositories with exactly 500 stars.                                                  |
| stars:n..n size:<n               | \`stars:10..20 size:<1000\`                            | Matches repositories with 10 to 20 stars, that are smaller than 1000 KB.                      |
| stars:>=n fork:true language:LANGUAGE | \`stars:>=500 fork:true language:php\`              | Matches repositories with at least 500 stars, including forked ones, written in PHP.          |

---

### Search by when a repository was created or last updated

You can filter repositories based on time of creation or time of last update. For repository creation, use the \`created\` qualifier; for last update, use the \`pushed\` qualifier.

Date formatting must follow the ISO8601 standard, which is YYYY-MM-DD (year-month-day). You can also add optional time information \`THH:MM:SS+00:00\` after the date.

| Qualifier                | Example                                              | Description                                                                                   |
|--------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| created:<YYYY-MM-DD      | \`webos created:<2011-01-01\`                          | Matches repositories with the word "webos" created before 2011.                               |
| pushed:>YYYY-MM-DD       | \`css pushed:>2013-02-01\`                             | Matches repositories with the word "css" pushed to after January 2013.                        |
| pushed:>=YYYY-MM-DD fork:only | \`case pushed:>=2013-03-06 fork:only\`           | Matches repositories with the word "case" pushed to on or after March 6th, 2013, and are forks.|

---

### Search by language

You can search repositories based on the language of the code in the repositories.

| Qualifier         | Example                        | Description                                                                                   |
|-------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| language:LANGUAGE | \`rails language:javascript\`    | Matches repositories with the word "rails" written in JavaScript.                             |

---

### Search by topic

You can find all of the repositories that are classified with a particular topic.

| Qualifier   | Example                | Description                                                                                   |
|-------------|------------------------|-----------------------------------------------------------------------------------------------|
| topic:TOPIC | \`topic:jekyll\`         | Matches repositories that have been classified with the topic "Jekyll."                       |

---

### Search by number of topics

You can search repositories by the number of topics that have been applied to the repositories.

| Qualifier   | Example                | Description                                                                                   |
|-------------|------------------------|-----------------------------------------------------------------------------------------------|
| topics:n    | \`topics:5\`             | Matches repositories that have five topics.                                                   |
| topics:>n   | \`topics:>3\`            | Matches repositories that have more than three topics.                                        |

---

### Search by license

You can search repositories by the type of license in the repositories.

| Qualifier              | Example                        | Description                                                                                   |
|------------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| license:LICENSE_KEYWORD| \`license:apache-2.0\`           | Matches repositories that are licensed under Apache License 2.0.                              |

---

### Search by repository visibility

You can filter your search based on the visibility of the repositories.

| Qualifier   | Example                        | Description                                                                                   |
|-------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| is:public   | \`is:public org:github\`         | Matches public repositories owned by GitHub.                                                  |
| is:private  | \`is:private pages\`             | Matches private repositories you can access and contain the word "pages."                     |

---

### Search based on repository custom property

You can filter repositories based on custom properties using the \`props.\` prefixed qualifiers. For these qualifiers to work, the search must be limited to a single organization.

| Qualifier              | Example                                              | Description                                                                                   |
|------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| props.PROPERTY:VALUE   | \`org:github props.environment:production\`            | Matches repositories from the github organization with the custom property environment=production.|

---

### Search based on whether a repository is a mirror

You can search repositories based on whether the repositories are mirrors and hosted elsewhere.

| Qualifier     | Example                        | Description                                                                                   |
|---------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| mirror:true   | \`mirror:true GNOME\`            | Matches repositories that are mirrors and contain the word "GNOME."                           |
| mirror:false  | \`mirror:false GNOME\`           | Matches repositories that are not mirrors and contain the word "GNOME."                       |

---

### Search based on whether a repository is a template

You can search repositories based on whether the repositories are templates.

| Qualifier       | Example                        | Description                                                                                   |
|-----------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| template:true   | \`template:true GNOME\`          | Matches repositories that are templates and contain the word "GNOME".                         |
| template:false  | \`template:false GNOME\`         | Matches repositories that are not templates and contain the word "GNOME".                     |

---

### Search based on whether a repository is archived

You can search repositories based on whether or not the repositories are archived.

| Qualifier       | Example                        | Description                                                                                   |
|-----------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| archived:true   | \`archived:true GNOME\`          | Matches repositories that are archived and contain the word "GNOME."                          |
| archived:false  | \`archived:false GNOME\`         | Matches repositories that are not archived and contain the word "GNOME."                      |

---

### Search based on number of issues with good first issue or help wanted labels

You can search for repositories that have a minimum number of issues labeled help-wanted or good-first-issue.

| Qualifier                | Example                                         | Description                                                                                   |
|--------------------------|-------------------------------------------------|-----------------------------------------------------------------------------------------------|
| good-first-issues:>n     | \`good-first-issues:>2 javascript\`               | Matches repositories with more than two issues labeled good-first-issue and contain "javascript."|
| help-wanted-issues:>n    | \`help-wanted-issues:>4 react\`                   | Matches repositories with more than four issues labeled help-wanted and contain "React."       |

---

### Search based on ability to sponsor

You can search for repositories whose owners can be sponsored on GitHub Sponsors with the \`is:sponsorable\` qualifier. You can also search for repositories that have a funding file using the \`has:funding-file\` qualifier.

| Qualifier         | Example                        | Description                                                                                   |
|-------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| is:sponsorable    | \`is:sponsorable\`               | Matches repositories whose owners have a GitHub Sponsors profile.                             |
| has:funding-file  | \`has:funding-file\`             | Matches repositories that have a FUNDING.yml file.                                            |
`;

const SCHEMA = z.object({
  q: z.string(),
  sort: z.enum(["updated", "stars", "forks", "help-wanted-issues"]).optional(),
  order: z.enum(["desc", "asc"]).optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
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

export const githubLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["repo"]);

  setCookie("github_oauth_state", state, {
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

export const unlinkGithubFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      githubUsername: null,
      githubAccessToken: null,
    },
  });

  return true;
});

export async function githubSearch({
  session,
  query,
  signal,
  aiEnhanced,
}: {
  session: NonNullable<Awaited<ReturnType<typeof getSessionFn>>>;
  query: string;
  signal: AbortSignal;
  aiEnhanced: boolean;
}) {
  const accessToken = session.githubAccessToken;
  if (!accessToken) return { data: null, error: new Error("No access token") };

  let queryParameters: z.output<typeof SCHEMA> | undefined = undefined;

  if (aiEnhanced) {
    const object = await generateAiEnhancedQueryParametersFn({
      data: { query },
    });

    queryParameters = object;
  } else {
    queryParameters = {
      q: query,
      per_page: 10,
    };
  }

  try {
    const { data } = await request("GET /search/repositories", {
      q: `${queryParameters.q} user:${session.githubUsername}`,
      per_page: queryParameters.per_page,
      page: queryParameters.page,
      sort: queryParameters.sort,
      order: queryParameters.order,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    });

    return {
      error: null,
      data: data.items.map((item) => (
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
      )),
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error("Unknown error occurred"),
    };
  }
}
