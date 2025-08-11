import { INTEGRATIONS, useSession } from "@/utils/helpers";
import {
  githubLoginFn,
  gmailLoginFn,
  googleDriveLoginFn,
} from "@/utils/server-functions";
import { Button, Card, CheckboxCards } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import { LucideChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";
import { useMemo } from "react";
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
  const { data: session, isLoading: isSessionLoading } = useSession();
  const githubLogin = useServerFn(githubLoginFn);
  const googleDriveLogin = useServerFn(googleDriveLoginFn);
  const gmailLogin = useServerFn(gmailLoginFn);

  const integrations = useMemo(
    () =>
      [
        {
          id: "googleDrive",
          name: "Google Drive",
          icon: <GoogleDriveLogo className="size-[4rem]" />,
          exists: !!session?.googleDriveUsername,
          usernameField: session?.googleDriveUsername,
          loginFn: googleDriveLogin,
        },
        {
          id: "notion",
          name: "Notion",
          icon: <NotionLogo className="size-[4rem]" />,
          exists: !!session?.notionUsername,
          usernameField: session?.notionUsername,
          loginFn: () => Promise.resolve(),
        },
        {
          id: "gmail",
          name: "Gmail",
          icon: <GmailLogo className="size-[4rem]" />,
          exists: !!session?.gmailUsername,
          usernameField: session?.gmailUsername,
          loginFn: gmailLogin,
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
        },
      ] as const,
    [session, githubLogin, googleDriveLogin],
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
                <CheckboxCards.Item
                  value={integration.id}
                  key={index}
                  className="flex flex-col items-center justify-start gap-3 px-3 text-center [&>button[role=checkbox]]:top-[0.625rem] [&>button[role=checkbox]]:right-[0.625rem] [&>button[role=checkbox]]:h-[1rem]"
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
              ) : (
                <Card
                  key={index}
                  className="flex flex-col items-center justify-start gap-3 p-[0.875rem] text-center"
                >
                  <div className="flex items-center justify-center">
                    {integration.icon}
                  </div>
                  <p className="text-3 text-gray-11 font-medium">
                    {integration.name}
                  </p>
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
          </CheckboxCards.Root>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
