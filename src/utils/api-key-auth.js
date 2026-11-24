import { validatePublishedApiKey } from "@/lib/campaigns/api-key.mjs";
import prisma from "@/lib/prisma";

export function validateApiKeyAndGetWaitlist(apiKey, waitlistId, requiredScope = "waitlist:write") {
  return validatePublishedApiKey(apiKey, waitlistId, prisma, { requiredScope });
}
