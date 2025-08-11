import { createSession, getSession, github } from "@/utils/auth";
import db from "@/utils/db";
import { redirect } from "@tanstack/react-router";
import {
  createServerFileRoute,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
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
      return new Response(null, {
        status: 400,
      });
    }

    if (state !== storedState) {
      return new Response(null, {
        status: 400,
      });
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await github.validateAuthorizationCode(code);
    } catch (e) {
      return new Response(null, {
        status: 400,
      });
    }

    const accessToken = tokens.accessToken();

    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUser = await githubUserResponse.json();
    const githubUsername = githubUser.login;

    const sessionId = getCookie("session")?.split(".")[0];

    let existingSession = null;

    if (sessionId) {
      existingSession = await getSession(sessionId);
    }

    if (existingSession !== null) {
      await db.session.update({
        where: { id: existingSession.id },
        data: {
          githubUsername: githubUsername,
          githubAccessToken: accessToken,
        },
      });

      setCookie(
        "session",
        existingSession.id + "." + existingSession.secretHash,
        {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        },
      );

      throw redirect({
        statusCode: 302,
        to: "/",
      });
    }

    const session = await createSession({
      githubUsername: githubUsername,
      githubAccessToken: accessToken,
    });

    setCookie("session", session.token, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    throw redirect({
      statusCode: 302,
      to: "/",
    });
  },
});
