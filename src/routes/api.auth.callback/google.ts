import { createSession, getSession, google } from "@/utils/auth";
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

    const target = getCookie("google_integration") ?? "drive";

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
    const accessTokenExpiresAt = tokens.accessTokenExpiresAt();
    const hasRefresh = tokens.hasRefreshToken();
    const refreshToken = hasRefresh ? tokens.refreshToken() : undefined;
    const refreshTokenExpiresIn =
      "refresh_token_expires_in" in tokens.data &&
      typeof (tokens.data as any).refresh_token_expires_in === "number"
        ? Number((tokens.data as any).refresh_token_expires_in)
        : undefined;

    const claims = decodeIdToken(tokens.idToken()) as {
      sub: string;
      name: string;
      email: string;
    };

    const googleName = claims["name"];

    const sessionId = getCookie("session")?.split(".")[0];

    let existingSession = null;

    if (sessionId) {
      existingSession = await getSession(sessionId);
    }

    if (existingSession !== null) {
      await db.session.update({
        where: { id: existingSession.id },
        data: {
          [`${target === "drive" ? "googleDrive" : "gmail"}Username`]:
            googleName,
          [`${target === "drive" ? "googleDrive" : "gmail"}AccessToken`]:
            accessToken,
          [`${target === "drive" ? "googleDrive" : "gmail"}AccessTokenExpiresAt`]:
            accessTokenExpiresAt ?? undefined,
          [`${target === "drive" ? "googleDrive" : "gmail"}RefreshToken`]:
            refreshToken ?? undefined,
          [`${target === "drive" ? "googleDrive" : "gmail"}RefreshTokenExpiresAt`]:
            refreshTokenExpiresIn
              ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
              : undefined,
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
      [`${target === "drive" ? "googleDrive" : "gmail"}Username`]: googleName,
      [`${target === "drive" ? "googleDrive" : "gmail"}AccessToken`]:
        accessToken,
      [`${target === "drive" ? "googleDrive" : "gmail"}AccessTokenExpiresAt`]:
        accessTokenExpiresAt ?? undefined,
      [`${target === "drive" ? "googleDrive" : "gmail"}RefreshToken`]:
        refreshToken ?? undefined,
      [`${target === "drive" ? "googleDrive" : "gmail"}RefreshTokenExpiresAt`]:
        refreshTokenExpiresIn
          ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
          : undefined,
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
