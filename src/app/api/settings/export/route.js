import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildAccountExport } from "@/lib/account-export.mjs";

const jsonHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return Response.json({ error: "Sign in to download your account data." }, { status: 401, headers: jsonHeaders });

  try {
    const userId = session.user.id;
    const [user, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, emailVerified: true, image: true, imageUrl: true, isOnboarded: true, createdAt: true, updatedAt: true },
      }),
      prisma.workspaceMember.findMany({
        where: { userId },
        select: { role: true, createdAt: true, workspace: { select: { id: true, name: true, createdAt: true, updatedAt: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    if (!user) return Response.json({ error: "Account data could not be found." }, { status: 404, headers: jsonHeaders });

    const workspaceIds = memberships.map(({ workspace }) => workspace.id);
    const [campaigns, apiKeys, integrations] = await Promise.all([
      prisma.waitList.findMany({
        where: { OR: [{ workspaceId: { in: workspaceIds } }, { workspaceId: null, userId }] },
        select: {
          id: true, name: true, description: true, websiteUrl: true, publicSlug: true, status: true,
          templateSnapshot: true, templateRevision: true, publishedRevision: true, publishedTemplateRevision: true,
          buttonColor: true, buttonBorder: true, buttonTextColor: true, mainBgColor: true, enableMainBgColor: true,
          bgColor: true, enableBgColor: true, borderWidth: true, borderRadius: true, fontWeight: true, logoSize: true,
          buttonText: true, successMessage: true, showLogo: true, showSocialProof: true, showBadge: true,
          showBranding: true, showReferrals: true, badgeColor: true, badgeText: true, badgeTextColor: true,
          inputColor: true, inputBorder: true, inputTextColor: true, placeholderText: true, twitterLink: true,
          facebookLink: true, instagramLink: true, linkedInLink: true, showSocialLinks: true,
          sendEmailsToSubscribers: true, ogTitle: true, ogDescription: true, ogImage: true, shareOnTwitter: true,
          shareOnWhatsapp: true, shareOnLinkedin: true, shareOnInstagram: true, shareOnFacebook: true,
          shareOnEmail: true, shareOnReddit: true,
          workspace: { select: { name: true } },
          customDomain: { select: { hostname: true, status: true, lastCheckedAt: true } },
          webhookSubscriptions: { select: { name: true, eventTypes: true, enabled: true, createdAt: true, updatedAt: true, lastDeliveredAt: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.apiKey.findMany({ where: { userId }, select: { name: true, scopes: true, expiresAt: true, lastUsedAt: true, revokedAt: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "asc" } }),
      prisma.workspaceIntegration.findMany({ where: { workspaceId: { in: workspaceIds } }, select: { provider: true, status: true, fromEmail: true, lastTestedAt: true, lastErrorCode: true, createdAt: true, updatedAt: true, workspace: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    ]);

    const payload = buildAccountExport({ user, memberships, campaigns, apiKeys, integrations });
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        ...jsonHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="waitlyze-account-data.json"',
      },
    });
  } catch {
    return Response.json({ error: "Could not prepare your account export. Try again." }, { status: 500, headers: jsonHeaders });
  }
}
