import { mcp } from "@better-auth/mcp";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { jwt } from "better-auth/plugins/jwt";

import { getMcpResourceUrl, MCP_SCOPES } from "./mcp/config.mjs";
import prisma from "./prisma.js";
import { checkRateLimit } from "./rate-limit.js";

const OAUTH_SCOPES = Object.freeze(["openid", "profile", "email", "offline_access", ...MCP_SCOPES]);
const globalForAuth = globalThis;

async function handleNewUser(user) {
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
}

function createAuth() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  const waitUntil = cfContext?.ctx?.waitUntil?.bind(cfContext.ctx);
  const reviewEmailPasswordEnabled = process.env.OPENAI_REVIEW_EMAIL_PASSWORD_AUTH === "true";

  const socialProviders = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    disabledPaths: ["/token"],
    database: prismaAdapter(prisma, {
      provider: "sqlite",
    }),
    telemetry: {
      enabled: false,
    },
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
      ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
    ].filter(Boolean),
    rateLimit: {
      enabled: true,
      customStorage: {
        async consume(key, rule) {
          const allowed = await checkRateLimit(
            prisma,
            `ba-rl:${key}`,
            rule.max,
            rule.window * 1000,
          );
          return { allowed, retryAfter: allowed ? null : rule.window };
        },
      },
      customRules: {
        "/oauth2/register": { window: 60, max: 10 },
        "/sign-in/email": { window: 60, max: 10 },
      },
    },
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
            allowedScopes: OAUTH_SCOPES,
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
      ipAddress: {
        // Cloudflare overwrites this with one validated client address before
        // the Worker runs, so Better Auth can rate-limit per visitor safely.
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      ...(waitUntil ? { backgroundTasks: { handler: waitUntil } } : {}),
      defaultCookieAttributes: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
      },
      database: {
        validateSchema: false,
      },
    },
    databaseHooks: {
      user: {
        create: {
          // The user already exists when this hook runs. Email delivery and
          // analytics are durable/best-effort follow-ups and must not extend or
          // fail the OAuth response.
          after: (user) => {
            const task = handleNewUser(user);
            if (waitUntil) {
              waitUntil(task);
              return;
            }
            return task;
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
}

export function getAuth() {
  const cfContext = globalThis[Symbol.for("__cloudflare-context__")];
  if (cfContext) {
    if (!cfContext.__auth) {
      cfContext.__auth = createAuth();
    }
    return cfContext.__auth;
  }

  if (!globalForAuth.auth) {
    globalForAuth.auth = createAuth();
  }
  return globalForAuth.auth;
}

export const auth = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getAuth();
      const value = Reflect.get(instance, prop, instance);
      if (typeof value === "function") {
        return value.bind(instance);
      }
      return value;
    },
    has(_target, prop) {
      return prop in getAuth();
    },
  },
);
