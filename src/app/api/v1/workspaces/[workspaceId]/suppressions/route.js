import {
  authenticateV1,
  resolveV1Workspace,
  v1CorsResponse,
  v1Error,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { normalizeSignupEmail } from "@/lib/normalize-email.mjs";
import prisma from "@/lib/prisma.js";

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "emails:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "viewAudience");
  if (wsCheck.error) return wsCheck.error;

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 100;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const where = { workspaceId: wsCheck.workspaceId };
  const [total, items] = await Promise.all([
    prisma.emailSuppression.count({ where }),
    prisma.emailSuppression.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
  ]);

  return v1Json(items, {
    budget,
    pagination: { total, limit, offset, hasMore: offset + items.length < total },
  });
}

export async function POST(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "emails:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageAudience");
  if (wsCheck.error) return wsCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return v1Error(400, "INVALID_JSON", "Request body must be valid JSON.", undefined, budget);
  }

  const normalized = normalizeSignupEmail(body?.email);
  if (!normalized) {
    return v1Error(400, "INVALID_EMAIL", "Enter a valid email address.", undefined, budget);
  }
  const reason = ["BOUNCED", "COMPLAINED", "MANUAL"].includes(body?.reason)
    ? body.reason
    : "MANUAL";

  const entry = await prisma.emailSuppression.upsert({
    where: {
      workspaceId_emailNormalized: {
        workspaceId: wsCheck.workspaceId,
        emailNormalized: normalized.lookupKey,
      },
    },
    update: { reason, detail: body?.detail ? String(body.detail).slice(0, 200) : null },
    create: {
      workspaceId: wsCheck.workspaceId,
      emailNormalized: normalized.lookupKey,
      reason,
      detail: body?.detail ? String(body.detail).slice(0, 200) : null,
    },
  });

  return v1Json(entry, { status: 201, budget });
}

export async function DELETE(request, { params }) {
  const { workspaceId } = await params;
  const auth = await authenticateV1(request, "emails:write");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const wsCheck = await resolveV1Workspace(authContext, workspaceId, "manageAudience");
  if (wsCheck.error) return wsCheck.error;

  const url = new URL(request.url);
  let emailParam = url.searchParams.get("email");
  if (!emailParam) {
    const body = await request.json().catch(() => ({}));
    emailParam = body?.email;
  }

  const normalized = normalizeSignupEmail(emailParam);
  if (!normalized) {
    return v1Error(
      400,
      "INVALID_EMAIL",
      "Provide email query param or JSON body.",
      undefined,
      budget,
    );
  }

  const res = await prisma.emailSuppression.deleteMany({
    where: { workspaceId: wsCheck.workspaceId, emailNormalized: normalized.lookupKey },
  });
  return v1Json({ deleted: res.count > 0, email: normalized.lookupKey }, { budget });
}
