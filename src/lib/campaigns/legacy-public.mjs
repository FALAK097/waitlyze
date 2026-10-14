// Shared reader for snapshot-less (legacy builder loop) public pages.
// Both /forms/[id] and the /w/[slug] fallback render through here.

// Every legacy-styled column the public form and referral loop read.
export const legacyPublicSelect = {
  id: true, name: true, description: true, status: true, publicSlug: true,
  templateSnapshot: true,
  mainBgColor: true, showReferrals: true, successMessage: true,
  shareOnEmail: true, shareOnFacebook: true, shareOnInstagram: true,
  shareOnLinkedin: true, shareOnReddit: true, shareOnTwitter: true,
  shareOnWhatsapp: true, showBranding: true,
  badgeColor: true, badgeText: true, badgeTextColor: true,
  bgColor: true, borderRadius: true, borderWidth: true,
  buttonBorder: true, buttonColor: true, buttonText: true, buttonTextColor: true,
  enableBgColor: true, fontWeight: true,
  inputBorder: true, inputColor: true, inputTextColor: true,
  logoUrl: true, placeholderText: true,
  showBadge: true, showLogo: true, showSocialProof: true,
  ogTitle: true, ogDescription: true, ogImage: true,
};

export async function getLegacyPublicWaitList(db, { id, slug }) {
  const where = id
    ? { id, status: "PUBLISHED" }
    : { publicSlug: slug, status: "PUBLISHED" };
  return db.waitList.findFirst({ where, select: legacyPublicSelect });
}

export async function getLegacyPublicSignUpsCount(db, waitListId) {
  return db.signUp.count({ where: { waitListId, waitList: { status: "PUBLISHED" } } });
}
