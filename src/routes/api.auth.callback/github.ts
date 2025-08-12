import { github } from "@/utils/auth";
import { ensureServerSession, setServerSession } from "@/utils/server-session";
import { redirect } from "@tanstack/react-router";
import { createServerFileRoute, getCookie } from "@tanstack/react-start/server";
import { OAuth2Tokens } from "arctic";

export const ServerRoute = createServerFileRoute(
  "/api/auth/callback/github",
).methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getCookie("github_oauth_state") ?? null;

    if (code === null || state === null || storedState === null) {
      throw new Error("Invalid code or state");
    }

    if (state !== storedState) {
      throw new Error("Invalid state");
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await github.validateAuthorizationCode(code);
    } catch (e) {
      throw new Error("Invalid code");
    }

    const accessToken = tokens.accessToken();

    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = await githubUserResponse.json();
    const githubUsername = githubUser.login;

    const session = ensureServerSession();
    const now = new Date();
    const updated = {
      ...session,
      lastVerifiedAt: now.toISOString(),
      githubUsername: githubUsername ?? session.githubUsername,
      githubAccessToken: accessToken ?? session.githubAccessToken,
    };
    setServerSession(updated);

    throw redirect({
      statusCode: 302,
      to: "/",
    });
  },
});
