import { renderToolOgImage } from "@/lib/og-image";

export const revalidate = false;

export async function GET() {
  return renderToolOgImage({
    title: "Waitlyze Launch Lab",
    eyebrow: "14 Free Pre-Launch Tools",
    subtitle:
      "Audit your waitlist page, model viral referral math, write launch copy, and carry the result straight into a working campaign.",
  });
}
