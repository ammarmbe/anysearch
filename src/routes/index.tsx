import GithubLogo from "@/components/icons/github";
import GmailLogo from "@/components/icons/gmail";
import GoogleDriveLogo from "@/components/icons/google-drive";
import Logo from "@/components/icons/logo";
import NotionLogo from "@/components/icons/notion";
import Integrations from "@/components/integrations";
import { githubSearch } from "@/search/github";
import gmailSearch from "@/search/gmail";
import { googleDriveSearch } from "@/search/google-drive";
import notionSearch from "@/search/notion";
import { INTEGRATIONS, useSession } from "@/utils/helpers";
import type { getSessionFn } from "@/utils/server-functions";
import { IconButton, Spinner, TextField, Tooltip } from "@radix-ui/themes";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LucideSearch, LucideSparkles, LucideX } from "lucide-react";
import { Fragment, JSX, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export const Route = createFileRoute("/")({
  component: Home,
});

type SearchResult =
  | {
      data: JSX.Element[];
      error: null;
    }
  | {
      data: null;
      error: Error;
    };

async function search({
  session,
  query,
  selected,
  signal,
  aiEnhanced,
}: {
  session: NonNullable<Awaited<ReturnType<typeof getSessionFn>>>;
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 py-[10rem] lg:gap-5">
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
      <ErrorUI
        github={data?.github?.error}
        notion={data?.notion?.error}
        googleDrive={data?.googleDrive?.error}
        gmail={data?.gmail?.error}
      />
      {data ? (
        <>
          {[
            data.github?.data,
            data.notion?.data,
            data.googleDrive?.data,
            data.gmail?.data,
          ].some((data) => data && data.length > 0) ? (
            <div
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              }}
              className="grid w-full max-w-7xl gap-4 py-4 lg:gap-5 lg:py-5"
            >
              {[
                data.github?.data,
                data.notion?.data,
                data.googleDrive?.data,
                data.gmail?.data,
              ].map((data, index) => (
                <Fragment key={index}>
                  {data?.map((item, i) => (
                    <Fragment key={i}>{item}</Fragment>
                  ))}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
          )}
        </>
      ) : (
        <Integrations selected={selected} setSelected={setSelected} />
      )}
    </div>
  );
}

function ErrorUI({
  github,
  notion,
  googleDrive,
  gmail,
}: {
  github?: Error | null;
  notion?: Error | null;
  googleDrive?: Error | null;
  gmail?: Error | null;
}) {
  return (
    <div className="flex h-5 items-center justify-center gap-4">
      {github ? (
        <Tooltip content={`GitHub Error: ${github.message}`}>
          <button>
            <GithubLogo className="size-5" fill="#d60808" />
          </button>
        </Tooltip>
      ) : null}
      {notion ? (
        <Tooltip content={`Notion Error: ${notion.message}`}>
          <button>
            <NotionLogo className="size-5" fill="#d60808" />
          </button>
        </Tooltip>
      ) : null}
      {googleDrive ? (
        <Tooltip content={`Google Drive Error: ${googleDrive.message}`}>
          <button>
            <GoogleDriveLogo className="size-5" fill="#d60808" />
          </button>
        </Tooltip>
      ) : null}
      {gmail ? (
        <Tooltip content={`Gmail Error: ${gmail.message}`}>
          <button>
            <GmailLogo className="size-5" fill="#d60808" />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
