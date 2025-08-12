/// <reference types="vite/client" />
import ErrorComponent from "@/components/error-component";
import NotFound from "@/components/not-found";
import { Theme } from "@radix-ui/themes";
import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import globalCss from "../global.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "AnySearch",
      },
    ],
    links: [
      { rel: "stylesheet", href: globalCss },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "og:image", href: "/opengraph.png" },
      { rel: "image_src", href: "/opengraph.png" },
      { property: "og:image:width", content: "1280" },
      { property: "og:image:height", content: "640" },
      { property: "og:title", content: "AnySearch" },
      {
        property: "og:description",
        content:
          "AnySearch lets you search across Notion, GitHub, Google Drive, and Gmail from one place.",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function RootComponent() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme accentColor="jade">
          <Outlet />
          <Toaster />
        </Theme>
        <Scripts />
      </body>
    </html>
  );
}
