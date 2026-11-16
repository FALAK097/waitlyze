import { createHash, timingSafeEqual } from "node:crypto";

import { auth } from "@/lib/auth.js";
import prisma from "@/lib/prisma.js";

/**
 * Resolves authentication for MCP requests.
 * Supports:
 * 1. Waitlyze API keys (wl2_... or wl_...) in Authorization header or x-waitlyze-api-key header
 * 2. OAuth 2.0 Bearer tokens in Authorization header
 * 3. Session cookies (for browser-based agent testing)
 */

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

export async function resolveMcpAuth(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const apiKeyHeader = request.headers.get("x-waitlyze-api-key") || "";

    let token = "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (apiKeyHeader) {
      token = apiKeyHeader.trim();
    }

    if (!token) {
      // Check session cookie as fallback.
      // Only honor cookies when the request originates from a trusted origin,
      // to prevent cross-site form POSTs from riding session cookies (CSRF).
      const origin = request.headers.get("origin");
      if (origin && !isTrustedOrigin(origin, request.url)) {
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
          "Authentication required. Provide an API key via 'Authorization: Bearer wl2_...' or 'x-waitlyze-api-key', or connect via OAuth 2.0 (RFC 9728).",
      };
    }

    // 1. Check API Key format (wl2_<keyId>_<secret>)
    const v2Match = /^wl2_([a-f0-9]{32})_([A-Za-z0-9_-]{43})$/.exec(token);
    if (v2Match) {
      const [, keyId, secret] = v2Match;
      const key = await prisma.apiKey.findUnique({
        where: { keyId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          waitlist: {
            select: { id: true, name: true, workspaceId: true, status: true },
          },
        },
      });

      if (!key || key.revokedAt) {
        return { authenticated: false, error: "Invalid or revoked API key." };
      }

      if (key.expiresAt && key.expiresAt <= new Date()) {
        return { authenticated: false, error: "API key has expired." };
      }

      const expected = Buffer.from(key.keyHash, "hex");
      const actual = createHash("sha256").update(secret).digest();
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        return { authenticated: false, error: "Invalid API key secret." };
      }

      // Update last used timestamp
      prisma.apiKey
        .updateMany({
          where: { id: key.id, revokedAt: null },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return {
        authenticated: true,
        authType: "api_key",
        userId: key.userId,
        user: key.user,
        waitlistId: key.waitlistId,
        workspaceId: key.waitlist?.workspaceId || null,
        scopes: key.scopes || ["waitlist:read", "waitlist:write"],
        keyId: key.keyId,
      };
    }

    // 2. Check OAuth 2.0 Access Token in database
    const oauthToken = await prisma.oauthAccessToken.findFirst({
      where: {
        token,
        revoked: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        client: { select: { clientId: true, clientName: true } },
      },
    });

    if (oauthToken && oauthToken.userId) {
      return {
        authenticated: true,
        authType: "oauth",
        userId: oauthToken.userId,
        user: oauthToken.user,
        clientId: oauthToken.clientId,
        clientName: oauthToken.client?.clientName,
        scopes: oauthToken.scopes || ["mcp:read", "mcp:write"],
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
      select: { id: true, name: true, workspaceId: true },
    });
    if (!waitlist) {
      throw new Error("Associated waitlist not found.");
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
