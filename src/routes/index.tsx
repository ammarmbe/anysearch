import { Logo } from "@/components/icons/logo";
import { Integrations } from "@/components/integrations";
import { TextField } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { LucideSearch } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 lg:gap-9">
      <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 lg:gap-6">
        <Logo className="w-[80%]" />
        <TextField.Root
          size="3"
          placeholder="Search"
          className="lg:text-4 w-full lg:h-8"
        >
          <TextField.Slot className="ml-0 lg:px-[0.8125rem]">
            <LucideSearch className="size-[1rem] lg:size-[1.25rem]" />
          </TextField.Slot>
        </TextField.Root>
      </div>
      <Integrations />
    </div>
  );
}
