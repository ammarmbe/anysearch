import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { generateCodeVerifier, generateState } from "arctic";
import { getSession, github, google } from "./auth";
import db from "./db";

export const getUserFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];

  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  return user;
});

export const githubLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["repo"]);

  setCookie("github_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  throw redirect({
    statusCode: 302,
    href: url.toString(),
  });
});

export const googleDriveLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.readonly",
  ]);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  setCookie("google_integration", "drive", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  setCookie("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  setCookie("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  throw redirect({
    statusCode: 302,
    href: url.toString(),
  });
});

export const gmailLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.readonly",
  ]);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  setCookie("google_integration", "gmail", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  setCookie("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  setCookie("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  throw redirect({
    statusCode: 302,
    href: url.toString(),
  });
});

export const getGoogleDriveAccessTokenFn = createServerFn().handler(
  async () => {
    const sessionId = getCookie("session")?.split(".")[0];
    if (!sessionId) return null;

    const session = await getSession(sessionId);
    if (!session) return null;

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });
    if (!user || !user.googleDrive) return null;

    const now = Date.now();
    const skewMs = 60_000; // 60s clock skew buffer

    if (
      user.googleDriveAccessToken &&
      user.googleDriveAccessTokenExpiresAt &&
      user.googleDriveAccessTokenExpiresAt.getTime() - skewMs > now
    ) {
      return user.googleDriveAccessToken;
    }

    if (!user.googleDriveRefreshToken) {
      return null;
    }

    try {
      const tokens = await google.refreshAccessToken(
        user.googleDriveRefreshToken,
      );
      const newAccessToken = tokens.accessToken();
      const accessTokenExpiresAt = tokens.accessTokenExpiresAt() ?? undefined;

      const refreshTokenFromProvider = tokens.hasRefreshToken()
        ? tokens.refreshToken()
        : undefined;
      const refreshToken =
        refreshTokenFromProvider ?? user.googleDriveRefreshToken;

      const refreshTokenExpiresIn =
        "refresh_token_expires_in" in tokens.data &&
        typeof (tokens.data as any).refresh_token_expires_in === "number"
          ? Number((tokens.data as any).refresh_token_expires_in)
          : undefined;

      await db.user.update({
        where: { id: user.id },
        data: {
          googleDriveAccessToken: newAccessToken,
          googleDriveAccessTokenExpiresAt: accessTokenExpiresAt,
          googleDriveRefreshToken: refreshToken,
          googleDriveRefreshTokenExpiresAt: refreshTokenExpiresIn
            ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
            : (user.googleDriveRefreshTokenExpiresAt ?? undefined),
        },
      });

      return newAccessToken;
    } catch {
      return null;
    }
  },
);

export const getGmailAccessTokenFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || !user.gmail) return null;

  const now = Date.now();
  const skewMs = 60_000; // 60s clock skew buffer

  if (
    user.gmailAccessToken &&
    user.gmailAccessTokenExpiresAt &&
    user.gmailAccessTokenExpiresAt.getTime() - skewMs > now
  ) {
    return user.gmailAccessToken;
  }

  if (!user.gmailRefreshToken) {
    return null;
  }

  try {
    const tokens = await google.refreshAccessToken(user.gmailRefreshToken);
    const newAccessToken = tokens.accessToken();
    const accessTokenExpiresAt = tokens.accessTokenExpiresAt() ?? undefined;

    const refreshTokenFromProvider = tokens.hasRefreshToken()
      ? tokens.refreshToken()
      : undefined;
    const refreshToken = refreshTokenFromProvider ?? user.gmailRefreshToken;

    const refreshTokenExpiresIn =
      "refresh_token_expires_in" in tokens.data &&
      typeof (tokens.data as any).refresh_token_expires_in === "number"
        ? Number((tokens.data as any).refresh_token_expires_in)
        : undefined;

    await db.user.update({
      where: { id: user.id },
      data: {
        gmailAccessToken: newAccessToken,
        gmailAccessTokenExpiresAt: accessTokenExpiresAt,
        gmailRefreshToken: refreshToken,
        gmailRefreshTokenExpiresAt: refreshTokenExpiresIn
          ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
          : (user.gmailRefreshTokenExpiresAt ?? undefined),
      },
    });

    return newAccessToken;
  } catch {
    return null;
  }
});
