import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

const socialProviders = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "https://waitlyze.falakgala.dev",
    "http://localhost:3000",
  ].filter(Boolean),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "ba",
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
    },
  },
  user: {
    additionalFields: {
      imageUrl: {
        type: "string",
        required: false,
      },
      isOnboarded: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
});
