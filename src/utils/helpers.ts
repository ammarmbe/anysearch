import { useQuery } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSessionFn } from "./server-functions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
