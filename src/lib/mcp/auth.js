import { createHash } from "node:crypto";

import { createLocalJWKSet, jwtVerify } from "jose";

import { auth } from "@/lib/auth.js";
import { validateApiKeyToken } from "@/lib/campaigns/api-key.mjs";
import { parseJsonStringArray } from "@/lib/db/sqlite-helpers.mjs";
import { getMcpBaseUrl, getMcpResourceUrl } from "@/lib/mcp/config.mjs";
import prisma from "@/lib/prisma.js";

let cachedJwks = null;
let cachedJwksTime = 0;
const JWKS_CACHE_TTL = 5 * 60 * 1000;
const requestAuthCache = new WeakMap();

async function getLocalJwks() {
  const now = Date.now();
  if (cachedJwks && now - cachedJwksTime < JWKS_CACHE_TTL) {
    return cachedJwks;
  }
  const records = await prisma.jwks.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  const keys = records
    .map((record) => {
      try {
        const parsed = JSON.parse(record.publicKey);
        if (!parsed.kid && record.id) parsed.kid = record.id;
        if (!parsed.alg && record.alg) parsed.alg = record.alg;
        return parsed;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  cachedJwks = { keys };
  cachedJwksTime = now;
  return cachedJwks;
}

function isTrustedOrigin(origin, requestUrl) {
  try {
    const configured = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
      Boolean,
    );
    for (const base of configured) {
      if (new URL(base).origin === origin) {
        return true;
      }
    }
    return new URL(requestUrl).origin === origin;
  } catch {
    return false;
  }
}

async function resolveMcpAuthUncached(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const apiKeyHeader =
      request.headers.get("x-waitlyze-api-key") || request.headers.get("x-api-key") || "";

    let token = "";
    if (/^bearer\s+/i.test(authHeader)) {
      token = authHeader.replace(/^bearer\s+/i, "").trim();
    } else if (apiKeyHeader) {
      token = apiKeyHeader.trim();
    }

    if (!token) {
      const secFetchSite = request.headers.get("sec-fetch-site");
      if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
        return {
          authenticated: false,
          error: "Untrusted origin. Use API key or OAuth authentication for cross-origin requests.",
        };
      }

      const origin = request.headers.get("origin");
      if (origin && !isTrustedOrigin(origin, request.url)) {
        return {
          authenticated: false,
          error: "Untrusted origin. Use API key or OAuth authentication for cross-origin requests.",
        };
      }

      const referer = request.headers.get("referer");
      if (!origin && referer) {
        try {
          if (!isTrustedOrigin(new URL(referer).origin, request.url)) {
            return {
              authenticated: false,
              error:
                "Untrusted origin. Use API key or OAuth authentication for cross-origin requests.",
            };
          }
        } catch {
          return {
            authenticated: false,
            error:
              "Untrusted origin. Use API key or OAuth authentication for cross-origin requests.",
          };
        }
      }

      if (request.method === "POST" && !origin && !referer && secFetchSite !== "same-origin") {
        return {
          authenticated: false,
          error: "Untrusted origin. Use API key or OAuth authentication for cross-origin requests.",
        };
      }

      try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user?.id) {
          return {
            authenticated: true,
            authType: "session",
            userId: session.user.id,
            user: session.user,
            scopes: ["mcp:read", "mcp:write"],
          };
        }
      } catch {
        // Ignore session read error
      }

      return {
        authenticated: false,
        error:
          "Authentication required. Provide an API key via 'Authorization: Bearer wl2_...' or 'X-Api-Key', or connect via OAuth 2.0 (RFC 9728).",
      };
    }

    // 1. Check API Key format (wl2_<keyId>_<secret>)
    if (token.startsWith("wl2_")) {
      const keyAuth = await validateApiKeyToken(token, prisma);
      if (!keyAuth.success) {
        return { authenticated: false, error: keyAuth.error || "Invalid or expired API key." };
      }
      return {
        authenticated: true,
        authType: "api_key",
        userId: keyAuth.userId,
        user: keyAuth.user,
        waitlistId: keyAuth.waitlistId,
        workspaceId: keyAuth.workspaceId,
        scopes: keyAuth.scopes,
        keyId: keyAuth.keyId,
        rawToken: token,
      };
    }

    // 2. Check OAuth 2.0 Access Token (signed JWT)
    if (token.split(".").length === 3) {
      try {
        const baseUrl = getMcpBaseUrl();
        const expectedIssuer = new URL("/api/auth", baseUrl).toString().replace(/\/$/, "");
        const expectedAudience = getMcpResourceUrl();
        const verifyOptions = {
          clockTolerance: 60,
          issuer: [expectedIssuer, `${expectedIssuer}/`, new URL(baseUrl).origin],
          audience: [expectedAudience, expectedAudience.replace(/\/$/, "")],
        };
        let jwks = await getLocalJwks();
        let keySet = createLocalJWKSet(jwks);
        let jwtResult;
        try {
          jwtResult = await jwtVerify(token, keySet, verifyOptions);
        } catch {
          cachedJwks = null;
          jwks = await getLocalJwks();
          keySet = createLocalJWKSet(jwks);
          jwtResult = await jwtVerify(token, keySet, verifyOptions);
        }

        const payload = jwtResult?.payload;
        if (payload?.sub) {
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, name: true, email: true },
          });

          if (user) {
            let scopes = [];
            if (typeof payload.scope === "string" && payload.scope.trim()) {
              scopes = payload.scope.trim().split(/\s+/);
            } else if (Array.isArray(payload.scope)) {
              scopes = payload.scope;
            } else if (Array.isArray(payload.scopes)) {
              scopes = payload.scopes;
            }

            return {
              authenticated: true,
              authType: "oauth",
              userId: user.id,
              user,
              clientId: payload.client_id || payload.azp || null,
              scopes,
            };
          }
        }
      } catch (jwtError) {
        console.warn("JWT access token verification failed:", jwtError?.message || jwtError);
      }
    }

    // 3. Fallback: Check OAuth 2.0 opaque access token in database
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const oauthToken = await prisma.oauthAccessToken.findFirst({
      where: {
        token: { in: [token, tokenHash] },
        revoked: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { clientId: true, name: true } },
      },
    });

    if (oauthToken && oauthToken.userId) {
      const parsedOAuthScopes = parseJsonStringArray(oauthToken.scopes);
      return {
        authenticated: true,
        authType: "oauth",
        userId: oauthToken.userId,
        user: oauthToken.user,
        clientId: oauthToken.clientId,
        clientName: oauthToken.client?.name,
        scopes: parsedOAuthScopes,
      };
    }

    return {
      authenticated: false,
      error: "Invalid or expired authorization token.",
    };
  } catch (error) {
    console.error("MCP auth error:", error);
    return {
      authenticated: false,
      error: "Authentication service error.",
    };
  }
}

export async function resolveMcpAuth(request) {
  if (request && typeof request === "object") {
    const cached = requestAuthCache.get(request);
    if (cached) return cached;
    const promise = resolveMcpAuthUncached(request);
    requestAuthCache.set(request, promise);
    return promise;
  }
  return resolveMcpAuthUncached(request);
}

/**
 * Resolves and validates tenant workspace isolation.
 */
export async function resolveWorkspaceContext(authContext, inputWorkspaceId = null) {
  if (!authContext?.authenticated || !authContext?.userId) {
    throw new Error(authContext?.error || "Unauthorized: Authentication required.");
  }

  // If auth is scoped to a specific waitlist API key
  if (authContext.waitlistId) {
    const waitlist = await prisma.waitList.findUnique({
      where: { id: authContext.waitlistId },
      select: { id: true, name: true, workspaceId: true, userId: true },
    });
    if (!waitlist) {
      throw new Error("Associated waitlist not found.");
    }
    if (waitlist.workspaceId) {
      const membership = await prisma.workspaceMember.findFirst({
        where: { workspaceId: waitlist.workspaceId, userId: authContext.userId },
        select: { role: true },
      });
      if (!membership) {
        throw new Error("Forbidden: API key creator is no longer a member of this workspace.");
      }
    } else if (waitlist.userId !== authContext.userId) {
      throw new Error("Forbidden: API key is not authorized for this waitlist.");
    }
    if (inputWorkspaceId && waitlist.workspaceId && inputWorkspaceId !== waitlist.workspaceId) {
      throw new Error("Forbidden: API key is not authorized for this workspace.");
    }
    return {
      workspaceId: waitlist.workspaceId,
      waitlistId: waitlist.id,
      userId: authContext.userId,
    };
  }

  // If auth is scoped to a specific workspace API key
  if (authContext.workspaceId) {
    if (inputWorkspaceId && inputWorkspaceId !== authContext.workspaceId) {
      throw new Error("Forbidden: API key is not authorized for this workspace.");
    }
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: authContext.workspaceId,
        userId: authContext.userId,
      },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });
    if (!membership) {
      throw new Error("Forbidden: API key creator is no longer a member of this workspace.");
    }
    return {
      workspaceId: authContext.workspaceId,
      workspaceName: membership.workspace?.name,
      userId: authContext.userId,
      role: membership.role,
    };
  }

  // If caller supplied an explicit workspaceId
  if (inputWorkspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: inputWorkspaceId,
        userId: authContext.userId,
      },
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!membership) {
      throw new Error(`Unauthorized: You are not a member of workspace '${inputWorkspaceId}'.`);
    }

    return {
      workspaceId: inputWorkspaceId,
      workspaceName: membership.workspace?.name,
      userId: authContext.userId,
      role: membership.role,
    };
  }

  // Default to personal workspace or first accessible workspace
  const personalWorkspace = await prisma.workspace.findFirst({
    where: { personalOwnerId: authContext.userId },
    select: { id: true, name: true },
  });

  if (personalWorkspace) {
    return {
      workspaceId: personalWorkspace.id,
      workspaceName: personalWorkspace.name,
      userId: authContext.userId,
      role: "OWNER",
    };
  }

  const firstMember = await prisma.workspaceMember.findFirst({
    where: { userId: authContext.userId },
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (firstMember?.workspace) {
    return {
      workspaceId: firstMember.workspace.id,
      workspaceName: firstMember.workspace.name,
      userId: authContext.userId,
      role: firstMember.role,
    };
  }

  throw new Error("No accessible workspace found. Please create a workspace first.");
}
