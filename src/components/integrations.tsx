import { authClient } from "@/utils/auth/client";
import { Button, Card, CheckboxCards } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { LucideChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";
import { GithubLogo } from "./icons/github";
import { GmailLogo } from "./icons/gmail";
import { GoogleDriveLogo } from "./icons/google-drive";
import { NotionLogo } from "./icons/notion";

const INTEGRATIONS: {
  id: string;
  name: string;
  icon: React.ReactNode;
  usernameField: (
    user?: typeof authClient.$Infer.Session.user,
  ) => string | undefined;
  scopes?: string[];
}[] = [
  {
    id: "google",
    name: "Google",
    icon: <GoogleDriveLogo className="size-[4rem]" />,
    usernameField: (user) => user?.email,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  },
  {
    id: "notion",
    name: "Notion",
    icon: <NotionLogo className="size-[4rem]" />,
    usernameField: (user) => user?.email,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: <GmailLogo className="size-[4rem]" />,
    usernameField: (user) => user?.email,
  },
  {
    id: "github",
    name: "Github",
    icon: <GithubLogo className="size-[4rem]" />,
    usernameField: (user) =>
      user?.githubUsername ? `@${user?.githubUsername}` : undefined,
  },
] as const;

export function Integrations({
  selected,
  setSelected,
}: {
  selected: string[];
  setSelected: (selected: string[]) => void;
}) {
  const { data: session } = authClient.useSession();

  const {
    data: accounts,
    isLoading: isAccountsLoading,
    refetch,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();

      if (error) {
        throw new Error(error.statusText);
      }

      return data;
    },
    retry: (count, error) => {
      if (error.message === "UNAUTHORIZED") return false;
      return count < 3;
    },
  });

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
            onValueChange={setSelected}
            disabled={isAccountsLoading}
          >
            {INTEGRATIONS.map((integration, index) =>
              accounts?.some(
                (account) => account.provider === integration.id,
              ) ? (
                <CheckboxCards.Item
                  value={integration.id}
                  key={index}
                  className="flex flex-col items-center justify-start gap-3 px-[2.25rem] [&>button[role=checkbox]]:top-[0.625rem] [&>button[role=checkbox]]:right-[0.625rem] [&>button[role=checkbox]]:h-[1rem]"
                >
                  <div className="flex items-center justify-center">
                    {integration.icon}
                  </div>
                  <p className="text-3 text-gray-11 font-medium">
                    {integration.name}
                  </p>
                  <p className="text-2 text-gray-10 flex h-6 items-center justify-center">
                    {integration.usernameField(session?.user)}
                  </p>
                </CheckboxCards.Item>
              ) : (
                <Card
                  key={index}
                  className="flex flex-col items-center justify-start gap-3 p-[0.875rem]"
                >
                  <div className="flex items-center justify-center">
                    {integration.icon}
                  </div>
                  <p className="text-3 text-gray-11 font-medium">
                    {integration.name}
                  </p>
                  <Button
                    onClick={async () => {
                      if (!session?.user) {
                        await authClient.signIn.social({
                          provider: integration.id,
                          scopes: integration.scopes,
                        });
                      } else {
                        await authClient.linkSocial({
                          provider: integration.id,
                          scopes: integration.scopes,
                        });
                      }

                      refetch();
                    }}
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
