import { createCampaignSignup } from "@/lib/campaigns/signups.mjs";
import prisma from "@/lib/prisma";

export const createSignUp = (signupData, referralId) =>
  createCampaignSignup(prisma, signupData, referralId);
