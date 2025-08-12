import { githubLoginFn, unlinkGithubFn } from "@/search/github";
import { gmailLoginFn, unlinkGmailFn } from "@/search/gmail";
import { googleDriveLoginFn, unlinkGoogleDriveFn } from "@/search/google-drive";
import { notionLoginFn, unlinkNotionFn } from "@/search/notion";
import { cn, INTEGRATIONS, useSession } from "@/utils/helpers";
import { Button, Card, CheckboxCards } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import { LucideCheck, LucideChevronDown, LucideEdit } from "lucide-react";
import { Accordion } from "radix-ui";
import { useMemo, useState } from "react";
import GithubLogo from "./icons/github";
import GmailLogo from "./icons/gmail";
import GoogleDriveLogo from "./icons/google-drive";
import NotionLogo from "./icons/notion";

export default function Integrations({
  selected,
  setSelected,
}: {
  selected: (typeof INTEGRATIONS)[number][];
  setSelected: (selected: (typeof INTEGRATIONS)[number][]) => void;
}) {
  const { data: session, isLoading: isSessionLoading, refetch } = useSession();

  const [editMode, setEditMode] = useState(false);

  const githubLogin = useServerFn(githubLoginFn);
  const googleDriveLogin = useServerFn(googleDriveLoginFn);
  const gmailLogin = useServerFn(gmailLoginFn);
  const notionLogin = useServerFn(notionLoginFn);
  const unlinkGithub = useServerFn(unlinkGithubFn);
  const unlinkGoogleDrive = useServerFn(unlinkGoogleDriveFn);
  const unlinkGmail = useServerFn(unlinkGmailFn);
  const unlinkNotion = useServerFn(unlinkNotionFn);

  const integrations = useMemo(
    () =>
      [
        {
          id: "notion",
          name: "Notion",
          icon: <NotionLogo className="size-[4rem]" />,
          exists: !!session?.notionUsername,
          usernameField: session?.notionUsername,
          loginFn: notionLogin,
          unlinkFn: unlinkNotion,
        },
        {
          id: "github",
          name: "Github",
          icon: <GithubLogo className="size-[4rem]" />,
          exists: !!session?.githubUsername,
          usernameField: session?.githubUsername
            ? `@${session?.githubUsername}`
            : undefined,
          loginFn: githubLogin,
          unlinkFn: unlinkGithub,
        },
        {
          id: "googleDrive",
          name: "Google Drive",
          icon: <GoogleDriveLogo className="size-[4rem]" />,
          exists: !!session?.googleDriveUsername,
          usernameField: session?.googleDriveUsername,
          loginFn: googleDriveLogin,
          unlinkFn: unlinkGoogleDrive,
        },
        {
          id: "gmail",
          name: "Gmail",
          icon: <GmailLogo className="size-[4rem]" />,
          exists: !!session?.gmailUsername,
          usernameField: session?.gmailUsername,
          loginFn: gmailLogin,
          unlinkFn: unlinkGmail,
        },
      ] as const,
    [
      session,
      githubLogin,
      googleDriveLogin,
      gmailLogin,
      notionLogin,
      unlinkGithub,
      unlinkGoogleDrive,
      unlinkGmail,
      unlinkNotion,
    ],
  );

  return (
    <Accordion.Root
      collapsible
      type="single"
      className="flex w-full max-w-5xl flex-col items-center justify-center gap-5"
    >
      <Accordion.Item value="integrations" className="w-full">
        <div className="mx-4 my-2">
          <Accordion.Trigger
            asChild
            className="w-full justify-between [&[data-state=open]>svg]:rotate-180"
          >
            <Button size="4" variant="ghost" color="gray">
              <p className="text-3 lg:text-4 text-gray-9 font-medium tracking-normal">
                Integrations
              </p>
              <LucideChevronDown className="text-gray-9 size-[1rem] transition-transform lg:size-[1.25rem]" />
            </Button>
          </Accordion.Trigger>
        </div>
        <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down w-full overflow-hidden">
          <CheckboxCards.Root
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            }}
            className="grid gap-4 py-4 lg:gap-5 lg:py-5"
            value={selected}
            onValueChange={(value) =>
              setSelected(value as (typeof INTEGRATIONS)[number][])
            }
            disabled={isSessionLoading}
          >
            {integrations.map((integration, index) =>
              integration.exists ? (
                <div
                  className="rounded-3 border-grayA-5 flex flex-col border"
                  key={index}
                >
                  <CheckboxCards.Item
                    value={integration.id}
                    className="bg-background -m-px flex grow flex-col items-center justify-start gap-3 px-3 text-center [&>button[role=checkbox]]:top-[0.625rem] [&>button[role=checkbox]]:right-[0.625rem] [&>button[role=checkbox]]:h-[1rem]"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex items-center justify-center">
                        {integration.icon}
                      </div>
                      <p className="text-3 text-gray-11 font-medium">
                        {integration.name}
                      </p>
                    </div>
                    <p className="text-2 text-gray-10 flex h-6 items-center justify-center">
                      {integration.usernameField}
                    </p>
                  </CheckboxCards.Item>
                  <div
                    className={cn(
                      "p-3 transition-all",
                      !editMode ? "-mt-[3.5rem]" : undefined,
                    )}
                  >
                    <Button
                      className="w-full"
                      variant="outline"
                      color="red"
                      onClick={async () => {
                        const ok = await integration.unlinkFn();
                        if (ok) {
                          await refetch();
                          setSelected(
                            selected.filter((id) => id !== integration.id),
                          );
                        }
                      }}
                    >
                      Unlink
                    </Button>
                  </div>
                </div>
              ) : (
                <Card
                  key={index}
                  className="flex flex-col items-center justify-between gap-3 p-[0.875rem] text-center"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center">
                      {integration.icon}
                    </div>
                    <p className="text-3 text-gray-11 font-medium">
                      {integration.name}
                    </p>
                  </div>
                  <Button
                    onClick={async () => await integration.loginFn()}
                    variant="outline"
                    color="gray"
                    className="w-full"
                  >
                    Link
                  </Button>
                </Card>
              ),
            )}

            <Card
              className="hover:border-grayA-7 border-grayA-5 flex items-center justify-center border before:hidden after:hidden"
              onClick={() => setEditMode(!editMode)}
              asChild
            >
              <button>
                {editMode ? (
                  <LucideCheck className="text-gray-7 size-[3rem]" />
                ) : (
                  <LucideEdit className="text-gray-7 size-[3rem]" />
                )}
              </button>
            </Card>
          </CheckboxCards.Root>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
