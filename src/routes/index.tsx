import Logo from "@/components/icons/logo";
import ResultsIntegrations from "@/components/results-integrations";
import { githubSearch } from "@/search/github";
import { gmailSearch } from "@/search/gmail";
import { googleDriveSearch } from "@/search/google-drive";
import { notionSearch } from "@/search/notion";
import {
  INTEGRATIONS,
  SearchResult,
  TSession,
  useSession,
} from "@/utils/helpers";
import { IconButton, Spinner, TextField, Tooltip } from "@radix-ui/themes";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideSearch, LucideSparkles, LucideX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export const Route = createFileRoute("/")({
  component: Home,
});

async function search({
  session,
  query,
  selected,
  signal,
  aiEnhanced,
}: {
  session: TSession;
  query: string;
  selected: string[];
  signal: AbortSignal;
  aiEnhanced: boolean;
}) {
  let githubPromise: Promise<SearchResult> | undefined = undefined;
  let notionPromise: Promise<SearchResult> | undefined = undefined;
  let googleDrivePromise: Promise<SearchResult> | undefined = undefined;
  let gmailPromise: Promise<SearchResult> | undefined = undefined;

  if (selected.includes("github")) {
    githubPromise = githubSearch({ session, query, signal, aiEnhanced });
  }

  if (selected.includes("notion")) {
    notionPromise = notionSearch({ session, query, signal, aiEnhanced });
  }

  if (selected.includes("googleDrive")) {
    googleDrivePromise = googleDriveSearch({ query, signal, aiEnhanced });
  }

  if (selected.includes("gmail")) {
    gmailPromise = gmailSearch({ query, signal, aiEnhanced });
  }

  const [githubData, notionData, googleDriveData, gmailData] =
    await Promise.all([
      githubPromise,
      notionPromise,
      googleDrivePromise,
      gmailPromise,
    ]);

  return {
    github: githubData,
    notion: notionData,
    googleDrive: googleDriveData,
    gmail: gmailData,
  };
}

function Home() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [query, setQuery] = useState("");
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [selected, setSelected] = useState<(typeof INTEGRATIONS)[number][]>([
    ...INTEGRATIONS,
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, isPlaceholderData, isLoading } = useQuery({
    queryKey: ["search", session, query, selected, aiEnhanced],
    queryFn:
      !query || !session
        ? () => null
        : async ({ signal }) =>
            await search({ session, query, selected, signal, aiEnhanced }),
    placeholderData: keepPreviousData,
  });

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setQuery(value);
  }, 500);

  useEffect(() => {
    if (session) {
      setSelected(
        selected.filter((integration) => session[`${integration}Username`]),
      );
    }
  }, [session]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-[10rem]">
      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-4 lg:max-w-3xl lg:gap-6">
        <Logo className="w-[80%]" />
        <TextField.Root
          ref={inputRef}
          id="search"
          type="search"
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
              <Spinner className="size-[0.9375rem] lg:size-[1.25rem]" />
            ) : (
              <LucideSearch className="size-[1rem] lg:size-[1.25rem]" />
            )}
          </TextField.Slot>
          {query ? (
            <TextField.Slot className="-mr-[0.1875rem] aspect-square h-full items-center justify-center px-0">
              <IconButton
                size="3"
                variant="ghost"
                color="gray"
                className="rounded-1 m-0 box-border size-[2rem] lg:size-[2.5rem]"
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
          <TextField.Slot className="mr-0 aspect-square h-full items-center justify-center px-0">
            <Tooltip
              content={
                aiEnhanced
                  ? "Disable AI Enhanced Search"
                  : "Enable AI Enhanced Search"
              }
            >
              <IconButton
                size="3"
                variant={aiEnhanced ? "soft" : "ghost"}
                color={aiEnhanced ? undefined : "gray"}
                className="rounded-1 m-0 box-border size-[2rem] lg:size-[2.5rem]"
                onClick={() => setAiEnhanced(!aiEnhanced)}
              >
                <LucideSparkles className="size-[1rem] lg:size-[1.25rem]" />
              </IconButton>
            </Tooltip>
          </TextField.Slot>
        </TextField.Root>
      </div>
      <ResultsIntegrations
        session={session}
        selected={selected}
        setSelected={setSelected}
        data={data}
        query={query}
      />
    </div>
  );
}
