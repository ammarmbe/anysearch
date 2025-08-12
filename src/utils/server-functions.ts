import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { generateCodeVerifier, generateState } from "arctic";
import { getSession, github, google, notion } from "./auth";
import db from "./db";

export const getSessionFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];

  if (!sessionId) {
    return null;
  }

  const response = await getSession(sessionId);

  if (!response) {
    return null;
  }

  const { secretHash, ...session } = response;

  return session;
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

export const notionLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const url = notion.createAuthorizationURL(state);

  setCookie("notion_oauth_state", state, {
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

export const getGmailAccessTokenFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  const now = Date.now();
  const skewMs = 60_000; // 60s clock skew buffer

  if (
    session.gmailAccessToken &&
    session.gmailAccessTokenExpiresAt &&
    session.gmailAccessTokenExpiresAt.getTime() - skewMs > now
  ) {
    return session.gmailAccessToken;
  }

  if (!session.gmailRefreshToken) {
    return null;
  }

  try {
    const tokens = await google.refreshAccessToken(session.gmailRefreshToken);
    const newAccessToken = tokens.accessToken();
    const accessTokenExpiresAt = tokens.accessTokenExpiresAt() ?? undefined;

    const refreshTokenFromProvider = tokens.hasRefreshToken()
      ? tokens.refreshToken()
      : undefined;
    const refreshToken = refreshTokenFromProvider ?? session.gmailRefreshToken;

    const refreshTokenExpiresIn =
      "refresh_token_expires_in" in tokens.data &&
      typeof (tokens.data as any).refresh_token_expires_in === "number"
        ? Number((tokens.data as any).refresh_token_expires_in)
        : undefined;

    await db.session.update({
      where: { id: session.id },
      data: {
        gmailAccessToken: newAccessToken,
        gmailAccessTokenExpiresAt: accessTokenExpiresAt,
        gmailRefreshToken: refreshToken,
        gmailRefreshTokenExpiresAt: refreshTokenExpiresIn
          ? new Date(Date.now() + refreshTokenExpiresIn * 1000)
          : (session.gmailRefreshTokenExpiresAt ?? undefined),
      },
    });

    return newAccessToken;
  } catch {
    return null;
  }
});

// Added unlink functions for integrations
export const unlinkGithubFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      githubUsername: null,
      githubAccessToken: null,
    },
  });

  return true;
});

export const unlinkNotionFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      notionUsername: null,
      notionAccessToken: null,
    },
  });

  return true;
});

export const unlinkGoogleDriveFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      googleDriveUsername: null,
      googleDriveAccessToken: null,
      googleDriveAccessTokenExpiresAt: null,
      googleDriveRefreshToken: null,
      googleDriveRefreshTokenExpiresAt: null,
    },
  });

  return true;
});

export const unlinkGmailFn = createServerFn().handler(async () => {
  const sessionId = getCookie("session")?.split(".")[0];
  if (!sessionId) return false;

  const session = await getSession(sessionId);
  if (!session) return false;

  await db.session.update({
    where: { id: session.id },
    data: {
      gmailUsername: null,
      gmailAccessToken: null,
      gmailAccessTokenExpiresAt: null,
      gmailRefreshToken: null,
      gmailRefreshTokenExpiresAt: null,
    },
  });

  return true;
});
