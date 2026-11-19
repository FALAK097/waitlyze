import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";

import { getMcpResourceUrl, MCP_SCOPES } from "./mcp/config.mjs";
import prisma from "./prisma.js";

const OAUTH_SCOPES = Object.freeze(["openid", "profile", "email", "offline_access", ...MCP_SCOPES]);
const reviewEmailPasswordEnabled = process.env.OPENAI_REVIEW_EMAIL_PASSWORD_AUTH === "true";

const socialProviders = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  disabledPaths: ["/token"],
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled:
      reviewEmailPasswordEnabled ||
      (process.env.NODE_ENV !== "production" &&
        process.env.LOCAL_DEV_EMAIL_PASSWORD_AUTH === "true"),
    disableSignUp: process.env.NODE_ENV === "production",
  },
  socialProviders,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "https://waitlyze.com",
    "http://localhost:3000",
  ].filter(Boolean),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: "/connect/login",
      consentPage: "/connect/consent",
      resource: getMcpResourceUrl(),
      scopes: OAUTH_SCOPES,
      resources: [
        {
          identifier: getMcpResourceUrl(),
          name: "Waitlyze MCP",
          allowedScopes: MCP_SCOPES,
          accessTokenTtl: 60 * 60,
          refreshTokenTtl: 30 * 24 * 60 * 60,
        },
      ],
      resourceSeedMode: "merge",
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
      clientRegistrationDefaultScopes: OAUTH_SCOPES,
      refreshTokenReuseInterval: 0,
    }),
  ],
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
            const [
              { renderWelcomeEmail },
              { welcomeText },
              { dispatchFounderNoticesNow },
              { enqueueFounderNotice },
              { env },
            ] = await Promise.all([
              import("@/emails/render.jsx"),
              import("@/emails/text.mjs"),
              import("./email/dispatch-now.mjs"),
              import("./emails/founder-notifications.mjs"),
              import("./env.mjs"),
            ]);
            try {
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
            } catch (emailError) {
              console.error(
                "Welcome email notice failed",
                emailError?.name || emailError?.message || "unknown error",
              );
            }

            // Track server-verified registration completion in PostHog
            try {
              const [{ trackServerEvent }, { POSTHOG_EVENTS }] = await Promise.all([
                import("@/lib/posthog/server.mjs"),
                import("@/lib/posthog/events.mjs"),
              ]);
              await trackServerEvent({
                distinctId: user.id,
                event: POSTHOG_EVENTS.MARKETING_SIGNUP_COMPLETED,
                properties: {
                  signup_method: user.emailVerified ? "oauth" : "email",
                },
              });
            } catch (analyticsError) {
              console.error(
                "Signup analytics failed",
                analyticsError?.name || analyticsError?.message || "unknown error",
              );
            }
          } catch (hookError) {
            console.error(
              "User registration hook failed",
              hookError?.name || hookError?.message || "unknown error",
            );
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
