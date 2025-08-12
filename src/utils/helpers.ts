import { useQuery } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { JSX } from "react";
import { twMerge } from "tailwind-merge";
import {
  readStoredSession,
  writeStoredSession,
  type StoredSession,
} from "./client-db";

export type TSession = {
  id: string;
  createdAt: Date;
  lastVerifiedAt: Date;

  githubUsername: string | null;
  githubAccessToken: string | null;

  notionUsername: string | null;
  notionAccessToken: string | null;

  googleDriveUsername: string | null;
  googleDriveAccessToken: string | null;
  googleDriveAccessTokenExpiresAt: Date | null;
  googleDriveRefreshToken: string | null;
  googleDriveRefreshTokenExpiresAt: Date | null;

  gmailUsername: string | null;
  gmailAccessToken: string | null;
  gmailAccessTokenExpiresAt: Date | null;
  gmailRefreshToken: string | null;
  gmailRefreshTokenExpiresAt: Date | null;
};
export type SearchResult =
  | {
      data: JSX.Element[];
      error: null;
    }
  | {
      data: null;
      error: Error;
    };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  if (!value) return null;
  try {
    return decodeURIComponent(value.split("=")[1] ?? "");
  } catch {
    return null;
  }
}

function toTSession(stored: StoredSession): TSession {
  return {
    id: stored.id,
    createdAt: new Date(stored.createdAt),
    lastVerifiedAt: new Date(stored.lastVerifiedAt),
    githubUsername: stored.githubUsername,
    githubAccessToken: stored.githubAccessToken,
    notionUsername: stored.notionUsername,
    notionAccessToken: stored.notionAccessToken,
    googleDriveUsername: stored.googleDriveUsername,
    googleDriveAccessToken: stored.googleDriveAccessToken,
    googleDriveAccessTokenExpiresAt: stored.googleDriveAccessTokenExpiresAt
      ? new Date(stored.googleDriveAccessTokenExpiresAt)
      : null,
    googleDriveRefreshToken: stored.googleDriveRefreshToken,
    googleDriveRefreshTokenExpiresAt: stored.googleDriveRefreshTokenExpiresAt
      ? new Date(stored.googleDriveRefreshTokenExpiresAt)
      : null,
    gmailUsername: stored.gmailUsername,
    gmailAccessToken: stored.gmailAccessToken,
    gmailAccessTokenExpiresAt: stored.gmailAccessTokenExpiresAt
      ? new Date(stored.gmailAccessTokenExpiresAt)
      : null,
    gmailRefreshToken: stored.gmailRefreshToken,
    gmailRefreshTokenExpiresAt: stored.gmailRefreshTokenExpiresAt
      ? new Date(stored.gmailRefreshTokenExpiresAt)
      : null,
  };
}

async function getClientSession(): Promise<TSession | null> {
  const stored = await readStoredSession();
  const cookieVal = parseCookie("client_session");

  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal) as StoredSession;
      // Sync IndexedDB if missing or outdated
      if (!stored || JSON.stringify(stored) !== JSON.stringify(parsed)) {
        await writeStoredSession(parsed);
      }
      return toTSession(parsed);
    } catch {
      // ignore cookie parse errors and fall back to IDB
    }
  }

  if (stored) return toTSession(stored);
  return null;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getClientSession,
  });
}

export const INTEGRATIONS = [
  "googleDrive",
  "notion",
  "gmail",
  "github",
] as const;
