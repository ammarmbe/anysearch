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

export const googleLoginFn = createServerFn().handler(async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
  ]);

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
