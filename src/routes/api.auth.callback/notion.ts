import { createSession, getSession, notion } from "@/utils/auth";
import db from "@/utils/db";
import { redirect } from "@tanstack/react-router";
import {
  createServerFileRoute,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
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
      tokens = await notion.validateAuthorizationCode(code);
    } catch (e) {
      return new Response(null, {
        status: 400,
      });
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

    const sessionId = getCookie("session")?.split(".")[0];

    let existingSession = null;

    if (sessionId) {
      existingSession = await getSession(sessionId);
    }

    if (existingSession !== null) {
      await db.session.update({
        where: { id: existingSession.id },
        data: {
          notionUsername: notionName,
          notionAccessToken: accessToken,
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
      notionUsername: notionName,
      notionAccessToken: accessToken,
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
