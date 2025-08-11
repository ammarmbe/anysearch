import { useQuery } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getUserFn } from "./server-functions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUserFn,
  });
}

export const INTEGRATIONS = [
  "googleDrive",
  "notion",
  "gmail",
  "github",
] as const;
