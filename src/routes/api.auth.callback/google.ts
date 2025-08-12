import { google } from "@/utils/auth";
import { ensureServerSession, setServerSession } from "@/utils/server-session";
import { redirect } from "@tanstack/react-router";
import { createServerFileRoute, getCookie } from "@tanstack/react-start/server";
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
      throw new Error("Invalid code or state");
    }

    if (state !== storedState) {
      throw new Error("Invalid state");
    }

    let tokens: OAuth2Tokens;

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
      throw new Error("Invalid code");
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

    const session = ensureServerSession();
    const now = new Date();
    const updated: any = {
      ...session,
      lastVerifiedAt: now.toISOString(),
    };
    const prefix = target === "drive" ? "googleDrive" : "gmail";
    updated[`${prefix}Username`] =
      googleName ?? session[`${prefix}Username` as const];
    updated[`${prefix}AccessToken`] =
      accessToken ?? session[`${prefix}AccessToken` as const];
    updated[`${prefix}AccessTokenExpiresAt`] = accessTokenExpiresAt
      ? accessTokenExpiresAt.toISOString()
      : session[`${prefix}AccessTokenExpiresAt` as const];
    if (refreshToken) {
      updated[`${prefix}RefreshToken`] = refreshToken;
    }
    if (refreshTokenExpiresIn) {
      updated[`${prefix}RefreshTokenExpiresAt`] = new Date(
        Date.now() + refreshTokenExpiresIn * 1000,
      ).toISOString();
    }
    setServerSession(updated);

    throw redirect({
      statusCode: 302,
      to: "/",
    });
  },
});
