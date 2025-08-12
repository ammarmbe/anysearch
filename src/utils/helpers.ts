import { Session } from "@/generated/prisma/client";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSession } from "./auth";

export type TSession = Omit<Session, "secretHash">;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getSessionFn = createServerFn().handler(async () => {
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

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getSessionFn,
  });
}

export const INTEGRATIONS = [
  "googleDrive",
  "notion",
  "gmail",
  "github",
] as const;
