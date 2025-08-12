import GithubLogo from "@/components/icons/github";
import GmailLogo from "@/components/icons/gmail";
import GoogleDriveLogo from "@/components/icons/google-drive";
import NotionLogo from "@/components/icons/notion";
import { githubLoginFn, unlinkGithubFn } from "@/search/github";
import { gmailLoginFn, unlinkGmailFn } from "@/search/gmail";
import { googleDriveLoginFn, unlinkGoogleDriveFn } from "@/search/google-drive";
import { notionLoginFn, unlinkNotionFn } from "@/search/notion";
import { INTEGRATIONS, SearchResult, TSession } from "@/utils/helpers";
import { Button, Card, IconButton, Tooltip } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LucideCheck, LucidePencil, LucideSearch, LucideX } from "lucide-react";
import { Accordion } from "radix-ui";
import { Fragment, useMemo, useState } from "react";

export default function ResultsIntegrations({
  session,
  selected,
  setSelected,
  data,
  query,
}: {
  session: TSession | null | undefined;
  selected: (typeof INTEGRATIONS)[number][];
  setSelected: (selected: (typeof INTEGRATIONS)[number][]) => void;
  data:
    | {
        github: SearchResult | undefined;
        notion: SearchResult | undefined;
        googleDrive: SearchResult | undefined;
        gmail: SearchResult | undefined;
      }
    | null
    | undefined;
  query: string;
}) {
  const queryClient = useQueryClient();

  const githubLogin = useServerFn(githubLoginFn);
  const googleDriveLogin = useServerFn(googleDriveLoginFn);
  const gmailLogin = useServerFn(gmailLoginFn);
  const notionLogin = useServerFn(notionLoginFn);
  const unlinkGithub = useServerFn(unlinkGithubFn);
  const unlinkGoogleDrive = useServerFn(unlinkGoogleDriveFn);
  const unlinkGmail = useServerFn(unlinkGmailFn);
  const unlinkNotion = useServerFn(unlinkNotionFn);

  const [editing, setEditing] = useState(false);

  const integrations = useMemo(
    () => [
      {
        id: "notion" as const,
        name: "Notion",
        icon: NotionLogo,
        exists: !!session?.notionUsername,
        error: data?.notion?.error,
        usernameField: session?.notionUsername,
        loginFn: notionLogin,
        unlinkFn: unlinkNotion,
        tooltip: (() => {
          if (data?.notion?.error?.message)
            return `Notion error: ${data?.notion?.error.message}`;
          if (data?.notion?.error) return `Unknown Notion error`;
          if (data?.notion?.data) return `Toggle Notion results`;
          return `Link Notion to get results`;
        })(),
      },
      {
        id: "github" as const,
        name: "Github",
        icon: GithubLogo,
        exists: !!session?.githubUsername,
        error: data?.github?.error,
        usernameField: session?.githubUsername
          ? `@${session?.githubUsername}`
          : undefined,
        loginFn: githubLogin,
        unlinkFn: unlinkGithub,
        tooltip: (() => {
          if (data?.github?.error?.message)
            return `Github error: ${data?.github?.error.message}`;
          if (data?.github?.error) return `Unknown Github error`;
          if (data?.github?.data) return `Toggle Github results`;
          return `Link Github to get results`;
        })(),
      },
      {
        id: "googleDrive" as const,
        name: "Google Drive",
        icon: GoogleDriveLogo,
        exists: !!session?.googleDriveUsername,
        error: data?.googleDrive?.error,
        usernameField: session?.googleDriveUsername,
        loginFn: googleDriveLogin,
        unlinkFn: unlinkGoogleDrive,
        tooltip: (() => {
          if (data?.googleDrive?.error?.message)
            return `Google Drive error: ${data?.googleDrive?.error.message}`;
          if (data?.googleDrive?.error) return `Unknown Google Drive error`;
          if (data?.googleDrive?.data) return `Toggle Google Drive results`;
          return `Link Google Drive to get results`;
        })(),
      },
      {
        id: "gmail" as const,
        name: "Gmail",
        icon: GmailLogo,
        exists: !!session?.gmailUsername,
        error: data?.gmail?.error,
        usernameField: session?.gmailUsername,
        loginFn: gmailLogin,
        unlinkFn: unlinkGmail,
        tooltip: (() => {
          if (data?.gmail?.error?.message)
            return `Gmail error: ${data?.gmail?.error.message}`;
          if (data?.gmail?.error) return `Unknown Gmail error`;
          if (data?.gmail?.data) return `Toggle Gmail results`;
          return `Link Gmail to get results`;
        })(),
      },
    ],
    [session, data],
  );

  return (
    <>
      <div className="flex h-5 items-center justify-center gap-4">
        {integrations.map((integration) => (
          <Tooltip key={integration.id} content={integration.tooltip}>
            <button
              className="cursor-pointer"
              onClick={() => {
                if (integration.exists) {
                  setSelected(
                    selected.includes(integration.id)
                      ? selected.filter((i) => i !== integration.id)
                      : [...selected, integration.id],
                  );
                } else {
                  integration.loginFn();
                }
              }}
            >
              <integration.icon
                className="size-5"
                fill={
                  integration.error
                    ? "#d60808"
                    : !selected.includes(integration.id) || !session
                      ? "#dddddd"
                      : undefined
                }
              />
            </button>
          </Tooltip>
        ))}
        <button
          className="flex size-5 cursor-pointer items-center justify-center"
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <LucideCheck className="size-[1.375rem]" />
          ) : (
            <LucidePencil className="size-[1.25rem]" />
          )}
        </button>
      </div>

      <Accordion.Root
        collapsible
        type="single"
        value={editing ? "integrations" : ""}
        className="flex w-full max-w-7xl flex-col items-center justify-center py-3"
      >
        <Accordion.Item value="integrations" className="flex w-full flex-col">
          <Accordion.Trigger className="w-full" />
          <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down w-full grow overflow-hidden">
            <div
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              }}
              className="grid w-full max-w-7xl gap-4 pb-[calc(var(--space-5)+var(--space-3))] lg:gap-5"
            >
              {integrations.map((integration) => (
                <Card
                  key={integration.id}
                  className="flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center justify-center">
                      <integration.icon className="size-[4rem]" />
                    </div>
                    <p className="text-3 text-gray-11 font-medium">
                      {integration.name}
                    </p>
                  </div>
                  {integration.exists ? (
                    <>
                      <p className="text-2 text-gray-10 flex h-6 items-center justify-center">
                        {integration.usernameField}
                      </p>
                      <IconButton
                        onClick={async () => {
                          const ok = await integration.unlinkFn();

                          if (ok) {
                            await queryClient.invalidateQueries({
                              predicate: (query) =>
                                query.queryKey[0] === "session",
                            });
                            setSelected(
                              selected.filter((id) => id !== integration.id),
                            );
                          }
                        }}
                        className="absolute top-1 right-1 m-0 p-2"
                        variant="ghost"
                        color="red"
                      >
                        <LucideX className="size-[1rem]" />
                      </IconButton>
                    </>
                  ) : (
                    <Button
                      onClick={async () => await integration.loginFn()}
                      variant="outline"
                      color="gray"
                      className="w-full"
                    >
                      Link
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="results" className="flex w-full flex-col">
          {[
            data?.github?.data,
            data?.notion?.data,
            data?.googleDrive?.data,
            data?.gmail?.data,
          ].some((data) => data && data.length > 0) ? (
            <div
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              }}
              className="grid w-full gap-4 lg:gap-5"
            >
              {[
                data?.github?.data,
                data?.notion?.data,
                data?.googleDrive?.data,
                data?.gmail?.data,
              ].map((data, index) => (
                <Fragment key={index}>
                  {data?.map((item, i) => (
                    <Fragment key={i}>{item}</Fragment>
                  ))}
                </Fragment>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center py-[4rem] text-center">
              <div className="text-gray-9 mb-2">
                <LucideSearch className="size-12" />
              </div>
              <p className="text-4 text-gray-11 mb-1 font-medium">
                No results found
              </p>
              <p className="text-3 text-gray-10">
                Try adjusting your search query or check your integrations
              </p>
            </div>
          ) : null}
        </Accordion.Item>
      </Accordion.Root>
    </>
  );
}
