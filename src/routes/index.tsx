import { Logo } from "@/components/icons/logo";
import { Integrations } from "@/components/integrations";
import { githubSearch } from "@/utils/search";
import { IconButton, Spinner, TextField } from "@radix-ui/themes";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideSearch, LucideX } from "lucide-react";
import { useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export const Route = createFileRoute("/")({
  component: Home,
});

async function search(query: string, signal: AbortSignal) {
  const data = await githubSearch(query, signal);

  return data;
}

function Home() {
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, isPlaceholderData, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: !query
      ? () => null
      : async ({ signal }) => await search(query, signal),
    placeholderData: keepPreviousData,
  });

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setQuery(value);
  }, 500);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-[10rem] lg:gap-9">
      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-4 lg:max-w-3xl lg:gap-6">
        <Logo className="w-[80%]" />
        <TextField.Root
          ref={inputRef}
          size="3"
          placeholder="Search"
          className="lg:text-4 w-full lg:h-8"
          onChange={(e) => {
            const value = e.currentTarget.value;

            if (!value) {
              debouncedSetQuery.cancel();
              setQuery("");
              return;
            }

            const cached = queryClient.getQueryData(["search", value]);

            if (cached !== undefined) {
              debouncedSetQuery.cancel();
              setQuery(value);
            } else {
              debouncedSetQuery(value);
            }
          }}
        >
          <TextField.Slot className="ml-0 lg:px-[0.8125rem]">
            {isLoading || (isFetching && isPlaceholderData) ? (
              <Spinner className="size-[1rem] lg:size-[1.25rem]" />
            ) : (
              <LucideSearch className="size-[1rem] lg:size-[1.25rem]" />
            )}
          </TextField.Slot>
          {query ? (
            <TextField.Slot>
              <IconButton
                size="3"
                variant="ghost"
                color="gray"
                className="rounded-1 lg:size-5"
                onClick={() => {
                  setQuery("");
                  if (inputRef.current) {
                    inputRef.current.value = "";
                    inputRef.current.focus();
                  }
                }}
              >
                <LucideX className="size-[1rem] lg:size-[1.25rem]" />
              </IconButton>
            </TextField.Slot>
          ) : null}
        </TextField.Root>
      </div>
      {data ? (
        <div
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          }}
          className="grid w-full max-w-7xl gap-4 py-4 lg:gap-5 lg:py-5"
        >
          {data}
        </div>
      ) : (
        <Integrations selected={selected} setSelected={setSelected} />
      )}
    </div>
  );
}
