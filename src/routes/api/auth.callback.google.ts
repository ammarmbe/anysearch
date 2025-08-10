import { createSession, google } from "@/utils/auth";
import db from "@/utils/db";
import { redirect } from "@tanstack/react-router";
import {
  createServerFileRoute,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { decodeIdToken, OAuth2Tokens } from "arctic";

export const ServerRoute = createServerFileRoute(
  "/api/auth/callback/google",
).methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getCookie("google_oauth_state") ?? null;
    const codeVerifier = getCookie("google_code_verifier") ?? null;

    if (
      code === null ||
      state === null ||
      storedState === null ||
      codeVerifier === null
    ) {
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
      tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
      return new Response(null, {
        status: 400,
      });
    }

    const accessToken = tokens.accessToken();

    const claims = decodeIdToken(tokens.idToken()) as {
      sub: string;
      name: string;
      email: string;
    };

    const googleUserId = claims["sub"];
    const googleName = claims["name"];
    const googleEmail = claims["email"];

    const existingUser = await db.user.findUnique({
      where: {
        email: googleEmail,
      },
    });

    if (existingUser !== null) {
      const session = await createSession(existingUser.id);

      await db.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          google: true,
          googleId: googleUserId,
          googleName: googleName,
          googleAccessToken: accessToken,
        },
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
    }

    const user = await db.user.create({
      data: {
        email: googleEmail,
        google: true,
        googleId: googleUserId,
        googleName: googleName,
        googleAccessToken: accessToken,
      },
    });

    const session = await createSession(user.id);

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
