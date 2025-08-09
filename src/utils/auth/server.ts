import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import db from "../db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  user: {
    additionalFields: {
      githubUsername: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env["GITHUB_CLIENT_ID"] as string,
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] as string,
    },
    google: {
      clientId: process.env["GOOGLE_CLIENT_ID"] as string,
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] as string,
    },
    notion: {
      clientId: process.env["NOTION_CLIENT_ID"] as string,
      clientSecret: process.env["NOTION_CLIENT_SECRET"] as string,
    },
  },
});
