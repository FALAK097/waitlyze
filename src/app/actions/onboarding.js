"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function completeOnboarding() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, message: "Sign in again to save your tour progress." };
  }

  try {
    await prisma.user.updateMany({
      where: { id: session.user.id, isOnboarded: false },
      data: { isOnboarded: true },
    });
    revalidatePath("/(app)", "layout");
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not save your tour progress." };
  }
}
