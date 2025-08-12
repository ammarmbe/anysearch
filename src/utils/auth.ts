import { GitHub, Google, Notion } from "arctic";

// OAuth Clients (server-only usage)

export const github = new GitHub(
  process.env["GITHUB_CLIENT_ID"]!,
  process.env["GITHUB_CLIENT_SECRET"]!,
  process.env["GITHUB_CLIENT_REDIRECT_URI"]!,
);

export const google = new Google(
  process.env["GOOGLE_CLIENT_ID"]!,
  process.env["GOOGLE_CLIENT_SECRET"]!,
  process.env["GOOGLE_CLIENT_REDIRECT_URI"]!,
);

export const notion = new Notion(
  process.env["NOTION_CLIENT_ID"]!,
  process.env["NOTION_CLIENT_SECRET"]!,
  process.env["NOTION_CLIENT_REDIRECT_URI"]!,
);
// This module now only exports OAuth clients. Session persistence is handled
// via client-side IndexedDB and a server-managed cookie in server-session.ts.
