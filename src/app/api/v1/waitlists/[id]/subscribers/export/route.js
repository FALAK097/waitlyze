import { NextResponse } from "next/server";

import { listSubscribersOp } from "@/lib/api/platform-ops.mjs";
import {
  applyBudgetHeaders,
  authenticateV1,
  requireV1Waitlist,
  v1CorsResponse,
  v1Json,
} from "@/lib/api/v1-auth.mjs";
import { mapOpError } from "@/lib/api/v1-errors.mjs";

function escapeCsvCell(value) {
  const str = String(value ?? "");
  const formulaSafe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function OPTIONS() {
  return v1CorsResponse();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await authenticateV1(request, "subscribers:read");
  if (auth.response) return auth.response;
  const { authContext, budget } = auth;

  const check = await requireV1Waitlist(authContext, id, "viewAudience", {
    id: true,
    workspaceId: true,
    publicSlug: true,
    showReferrals: true,
  });
  if (check.error) return check.error;

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "1000", 10);
  const rawOffset = Number.parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 2000) : 1000;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  const status = (url.searchParams.get("status") || "ALL").toUpperCase();

  try {
    const result = await listSubscribersOp({
      waitlist: check.waitlist,
      status,
      limit,
      offset,
      sortBy: url.searchParams.get("sortBy") || "createdAt",
      sortOrder: url.searchParams.get("sortOrder") || "asc",
    });

    if (format === "csv") {
      const headers = [
        "id",
        "email",
        "phone",
        "referralCode",
        "position",
        "points",
        "referralCount",
        "isVerified",
        "verifiedAt",
        "marketingConsent",
        "country",
        "city",
        "device",
        "utmSource",
        "utmMedium",
        "utmCampaign",
        "createdAt",
      ];
      const rows = [
        headers.join(","),
        ...result.items.map((item) =>
          [
            item.id,
            item.email,
            item.phone || "",
            item.referralCode || "",
            item.position ?? "",
            item.points ?? 0,
            item.referralCount ?? 0,
            item.isVerified ? "true" : "false",
            item.verifiedAt ? new Date(item.verifiedAt).toISOString() : "",
            item.marketingConsent ? "true" : "false",
            item.country || "",
            item.city || "",
            item.device || "",
            item.utmSource || "",
            item.utmMedium || "",
            item.utmCampaign || "",
            item.createdAt ? new Date(item.createdAt).toISOString() : "",
          ]
            .map(escapeCsvCell)
            .join(","),
        ),
      ];
      const slug = check.waitlist.publicSlug || check.waitlist.id;
      const response = new NextResponse(rows.join("\r\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${slug}-subscribers.csv"`,
          "X-Total-Count": String(result.total),
          "Access-Control-Allow-Origin": "*",
        },
      });
      return applyBudgetHeaders(response, budget);
    }

    return v1Json(result.items, {
      budget,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.items.length < result.total,
      },
    });
  } catch (error) {
    return mapOpError(error, budget);
  }
}
