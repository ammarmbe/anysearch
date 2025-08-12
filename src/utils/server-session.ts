import { getCookie, setCookie } from "@tanstack/react-start/server";

export type ServerStoredSession = {
  id: string;
  createdAt: string;
  lastVerifiedAt: string;

  githubUsername: string | null;
  githubAccessToken: string | null;

  notionUsername: string | null;
  notionAccessToken: string | null;

  googleDriveUsername: string | null;
  googleDriveAccessToken: string | null;
  googleDriveAccessTokenExpiresAt: string | null;
  googleDriveRefreshToken: string | null;
  googleDriveRefreshTokenExpiresAt: string | null;

  gmailUsername: string | null;
  gmailAccessToken: string | null;
  gmailAccessTokenExpiresAt: string | null;
  gmailRefreshToken: string | null;
  gmailRefreshTokenExpiresAt: string | null;
};

export function generateId(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i]! >> 3];
  }
  return id;
}

export function getServerSession(): ServerStoredSession | null {
  const value = getCookie("client_session");
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ServerStoredSession;
    return parsed;
  } catch {
    return null;
  }
}

export function setServerSession(session: ServerStoredSession): void {
  setCookie("client_session", JSON.stringify(session), {
    path: "/",
    httpOnly: false, // readable by client to hydrate IndexedDB
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function ensureServerSession(): ServerStoredSession {
  const existing = getServerSession();
  if (existing) return existing;
  const now = new Date();
  const fresh: ServerStoredSession = {
    id: generateId(),
    createdAt: now.toISOString(),
    lastVerifiedAt: now.toISOString(),
    githubUsername: null,
    githubAccessToken: null,
    notionUsername: null,
    notionAccessToken: null,
    googleDriveUsername: null,
    googleDriveAccessToken: null,
    googleDriveAccessTokenExpiresAt: null,
    googleDriveRefreshToken: null,
    googleDriveRefreshTokenExpiresAt: null,
    gmailUsername: null,
    gmailAccessToken: null,
    gmailAccessTokenExpiresAt: null,
    gmailRefreshToken: null,
    gmailRefreshTokenExpiresAt: null,
  };
  setServerSession(fresh);
  return fresh;
}
