import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { renderWelcomeEmail } from "@/emails/render.jsx";
import { welcomeText } from "@/emails/text.mjs";

import { dispatchFounderNoticesNow } from "./email/dispatch-now.mjs";
import { enqueueFounderNotice } from "./emails/founder-notifications.mjs";
import { env } from "./env.mjs";
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
  databaseHooks: {
    user: {
      create: {
        // Best-effort product welcome email, queued through the outbox so a
        // provider blip delays it instead of dropping it. A failure must never
        // block or roll back account creation.
        after: async (user) => {
          try {
            if (!user?.email) return;
            const url = new URL("/waitlists", env.BETTER_AUTH_URL).toString();
            const props = { name: user.name, url };
            const eventKey = await enqueueFounderNotice(prisma, {
              kind: "welcome",
              to: user.email,
              subject: "Welcome to Waitlyze",
              html: await renderWelcomeEmail(props),
              text: welcomeText(props),
              idempotencyKey: `welcome-${user.id}`,
            });
            if (eventKey) await dispatchFounderNoticesNow([eventKey]);
          } catch (error) {
            console.error("Welcome email failed", error?.name || error?.message || "unknown error");
          }
        },
      },
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
