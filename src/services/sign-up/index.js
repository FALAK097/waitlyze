import prisma from "@/lib/prisma";
import { createCampaignSignup } from "@/lib/campaigns/signups.mjs";

export const createSignUp = (signupData, referralId) =>
  createCampaignSignup(prisma, signupData, referralId);
