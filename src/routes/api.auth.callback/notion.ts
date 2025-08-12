import { notion } from "@/utils/auth";
import { ensureServerSession, setServerSession } from "@/utils/server-session";
import { redirect } from "@tanstack/react-router";
import { createServerFileRoute, getCookie } from "@tanstack/react-start/server";
import { OAuth2Tokens } from "arctic";

export const ServerRoute = createServerFileRoute(
  "/api/auth/callback/notion",
).methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getCookie("notion_oauth_state") ?? null;

    if (code === null || state === null || storedState === null) {
      throw new Error("Invalid code or state");
    }

    if (state !== storedState) {
      throw new Error("Invalid state");
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await notion.validateAuthorizationCode(code);
    } catch (e) {
      throw new Error("Invalid code");
    }

    const accessToken = tokens.accessToken();

    const notionUserResponse = await fetch(
      "https://api.notion.com/v1/users/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": "2022-06-28",
        },
      },
    );

    const notionUser = await notionUserResponse.json();
    const notionName = notionUser?.bot?.owner?.user?.name;

    const session = ensureServerSession();
    const now = new Date();
    const updated = {
      ...session,
      lastVerifiedAt: now.toISOString(),
      notionUsername: notionName ?? session.notionUsername,
      notionAccessToken: accessToken ?? session.notionAccessToken,
    };
    setServerSession(updated);

    throw redirect({
      statusCode: 302,
      to: "/",
    });
  },
});
