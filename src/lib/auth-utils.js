import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

export async function verifyWaitlistOwnership(waitListId, userId) {
  const count = await prisma.waitList.count({
    where: { id: waitListId, userId },
  });
  return count > 0;
}
