const campaignFields = [
  "name", "description", "websiteUrl", "publicSlug", "status", "templateSnapshot", "logoUrl",
  "templateRevision", "publishedRevision", "publishedTemplateRevision", "buttonColor",
  "buttonBorder", "buttonTextColor", "mainBgColor", "enableMainBgColor", "bgColor",
  "enableBgColor", "borderWidth", "borderRadius", "fontWeight", "logoSize", "buttonText",
  "successMessage", "showLogo", "showSocialProof", "showBadge", "showBranding",
  "showReferrals", "badgeColor", "badgeText", "badgeTextColor", "inputColor",
  "inputBorder", "inputTextColor", "placeholderText", "twitterLink", "facebookLink",
  "instagramLink", "linkedInLink", "showSocialLinks", "sendEmailsToSubscribers", "ogTitle",
  "ogDescription", "ogImage", "shareOnTwitter", "shareOnWhatsapp", "shareOnLinkedin",
  "shareOnInstagram", "shareOnFacebook", "shareOnEmail", "shareOnReddit",
];

function pick(source, fields) {
  return Object.fromEntries(fields.map((field) => [field, source[field]]));
}

function automationConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  return pick(config, ["trigger", "delayMinutes", "subject", "body", "milestoneCount"]);
}

export function buildAccountExport({ user, memberships, campaigns, apiKeys, integrations, customDomains, webhooks }) {
  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    account: pick(user, ["email", "name", "emailVerified", "image", "imageUrl", "isOnboarded", "createdAt", "updatedAt"]),
    workspaces: memberships.map(({ role, createdAt, workspace }) => ({
      name: workspace.name,
      role,
      joinedAt: createdAt,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    })),
    campaigns: campaigns.map((campaign) => ({
      ...pick(campaign, campaignFields),
      workspaceName: campaign.workspace?.name ?? null,
      customDomain: campaign.customDomain ? {
        hostname: campaign.customDomain.hostname,
        status: campaign.customDomain.status,
        lastCheckedAt: campaign.customDomain.lastCheckedAt,
      } : null,
      webhooks: campaign.webhookSubscriptions.map(({ name, eventTypes, enabled, createdAt, updatedAt, lastDeliveredAt }) => ({ name, eventTypes, enabled, createdAt, updatedAt, lastDeliveredAt })),
      emailTemplates: (campaign.emailTemplateRecords ?? []).map(({ type, subject, previewText, header, subHeader, mainBody, subBody, createdAt, updatedAt }) => ({ type, subject, previewText, header, subHeader, mainBody, subBody, createdAt, updatedAt })),
      automations: (campaign.automationRecipes ?? []).map(({ type, status, currentVersion, createdAt, updatedAt, versions }) => ({
        type,
        status,
        currentVersion,
        createdAt,
        updatedAt,
        versions: versions.map(({ version, config, createdAt: versionCreatedAt }) => ({ version, config: automationConfig(config), createdAt: versionCreatedAt })),
      })),
      broadcasts: (campaign.broadcasts ?? []).map(({ name, subject, previewText, body, status, recipientCount, createdAt, updatedAt, sentAt }) => ({ name, subject, previewText, body, status, recipientCount, createdAt, updatedAt, sentAt })),
    })),
    developerKeys: apiKeys.map(({ name, scopes, expiresAt, lastUsedAt, revokedAt, createdAt, updatedAt }) => ({ name, scopes, expiresAt, lastUsedAt, revokedAt, createdAt, updatedAt })),
    integrations: integrations.map(({ provider, status, fromEmail, lastTestedAt, lastErrorCode, createdAt, updatedAt, workspace }) => ({ workspaceName: workspace?.name ?? null, provider, status, fromEmail, lastTestedAt, lastErrorCode, createdAt, updatedAt })),
    dataNotes: [
      "Subscriber records and their personal data are not included. Download subscribers from each waitlist's Subscribers page.",
      "API keys, integration credentials, webhook signing secrets, sessions, and authentication tokens are not included.",
      "Email templates, broadcast copy, and automation recipe versions are included; delivery recipients and automation runs are not.",
      "Webhook endpoint URLs are omitted because they may contain credentials.",
      "Workspace data includes only workspaces where you are currently a member and campaigns in those workspaces, plus legacy campaigns not linked to a workspace.",
    ],
  };
}
