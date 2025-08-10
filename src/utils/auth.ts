import type { Session } from "@/generated/prisma/client";
import { GitHub, Google } from "arctic";
import db from "./db";

// Types

interface TSessionWithToken extends Session {
  token: string;
}

// Constants

const inactivityTimeoutSeconds = 60 * 60 * 24 * 30; // 30 days
const activityCheckIntervalSeconds = 60 * 60 * 24; // 1 day

// Clients

export const github = new GitHub(
  process.env["GITHUB_CLIENT_ID"]!,
  process.env["GITHUB_CLIENT_SECRET"]!,
  null,
);

export const google = new Google(
  process.env["GOOGLE_CLIENT_ID"]!,
  process.env["GOOGLE_CLIENT_SECRET"]!,
  `${process.env["BASE_URL"]}/api/auth/callback/google`,
);

// Helpers

export function generateSecureRandomString() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  let id = "";

  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i]! >> 3];
  }

  return id;
}

async function hashSecret(secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(secretHashBuffer);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.byteLength; i++) {
    c |= a[i]! ^ b[i]!;
  }
  return c === 0;
}

// Functions

export async function createSession(userId: string) {
  const now = new Date();

  const id = generateSecureRandomString();
  const secret = generateSecureRandomString();
  const secretHash = await hashSecret(secret);

  const token = id + "." + secret;

  const session: TSessionWithToken = {
    id,
    userId,
    secretHash,
    createdAt: now,
    lastVerifiedAt: now,
    token,
  };

  await db.session.create({
    data: {
      id,
      userId,
      secretHash,
      createdAt: now,
      lastVerifiedAt: now,
    },
  });

  return session;
}

export async function validateSessionToken(token: string) {
  const now = new Date();

  const tokenParts = token.split(".");
  if (tokenParts.length !== 2) {
    return null;
  }
  const sessionId = tokenParts[0];
  const sessionSecret = tokenParts[1];

  if (!sessionId || !sessionSecret) {
    return null;
  }

  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const tokenSecretHash = await hashSecret(sessionSecret);
  const validSecret = constantTimeEqual(tokenSecretHash, session.secretHash);
  if (!validSecret) {
    return null;
  }

  if (
    now.getTime() - session.lastVerifiedAt.getTime() >=
    activityCheckIntervalSeconds * 1000
  ) {
    session.lastVerifiedAt = now;
    await db.session.update({
      where: {
        id: sessionId,
      },
      data: {
        lastVerifiedAt: now,
      },
    });
  }

  return session;
}

export async function getSession(sessionId: string) {
  const now = new Date();

  const result = await db.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!result) {
    return null;
  }

  if (
    now.getTime() - result.lastVerifiedAt.getTime() >=
    inactivityTimeoutSeconds * 1000
  ) {
    await deleteSession(sessionId);
    return null;
  }

  return result;
}

async function deleteSession(sessionId: string) {
  await db.session.delete({
    where: {
      id: sessionId,
    },
  });
}
