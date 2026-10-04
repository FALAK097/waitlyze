import prisma from "@/lib/prisma";
import { validatePublishedApiKey } from "@/lib/campaigns/api-key.mjs";

export function validateApiKeyAndGetWaitlist(apiKey, waitlistId) {
  return validatePublishedApiKey(apiKey, waitlistId, prisma);
}
