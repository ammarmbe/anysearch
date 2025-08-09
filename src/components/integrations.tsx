import { authClient } from "@/utils/auth/client";
import { Button, CheckboxCards } from "@radix-ui/themes";
import { LucideChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";
import { GithubLogo } from "./icons/github";
import { GmailLogo } from "./icons/gmail";
import { GoogleDriveLogo } from "./icons/google-drive";
import { NotionLogo } from "./icons/notion";

const INTEGRATIONS = [
  {
    id: "google",
    name: "Google",
    icon: <GoogleDriveLogo className="size-[4rem]" />,
  },
  {
    id: "notion",
    name: "Notion",
    icon: <NotionLogo className="size-[4rem]" />,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: <GmailLogo className="size-[4rem]" />,
  },
  {
    id: "github",
    name: "Github",
    icon: <GithubLogo className="size-[4rem]" />,
  },
];

export function Integrations() {
  const { data: session } = authClient.useSession();

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
              <p className="text-3 lg:text-4 text-gray-11 font-medium tracking-normal">
                Integrations
              </p>
              <LucideChevronDown className="size-[1rem] transition-transform lg:size-[1.25rem]" />
            </Button>
          </Accordion.Trigger>
        </div>
        <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down w-full overflow-hidden">
          <CheckboxCards.Root
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            }}
            className="grid gap-4 py-4 lg:gap-5 lg:py-5"
          >
            {INTEGRATIONS.map((integration, index) => (
              <CheckboxCards.Item
                value={integration.id}
                key={index}
                className="flex flex-col items-center justify-start gap-3 px-[2.25rem] [&>button]:top-[0.625rem] [&>button]:right-[0.625rem] [&>button]:h-[1rem]"
                onClick={async () => {
                  if (session?.user) {
                    await authClient.linkSocial({
                      provider: "github",
                    });
                  } else {
                    await authClient.signIn.social({
                      provider: "github",
                    });
                  }
                }}
              >
                <div className="flex items-center justify-center">
                  {integration.icon}
                </div>
                <p className="text-3 text-gray-11 font-medium">
                  {integration.name}
                </p>
              </CheckboxCards.Item>
            ))}
          </CheckboxCards.Root>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
