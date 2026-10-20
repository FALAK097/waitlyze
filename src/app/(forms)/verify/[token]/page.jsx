import { createHash } from "node:crypto";

import prisma from "@/lib/prisma";

import { VerifyAction } from "./verify-action";

export const metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

export default async function VerifySignupPage({ params, searchParams }) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const candidate = query?.returnTo;
  const returnPath =
    typeof candidate === "string" && /^\/w\/[A-Za-z0-9_-]+$/.test(candidate) ? candidate : "/";

  let waitlistName = null;
  if (typeof token === "string" && token.length >= 16 && token.length <= 128) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const verification = await prisma.signUpVerification.findUnique({
      where: { tokenHash },
      select: { signUp: { select: { waitList: { select: { name: true } } } } },
    });
    waitlistName = verification?.signUp?.waitList?.name || null;
  }

  return <VerifyAction token={token} returnPath={returnPath} waitlistName={waitlistName} />;
}
