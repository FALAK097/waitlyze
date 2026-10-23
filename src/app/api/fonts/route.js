import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env.mjs";
import { FALLBACK_FONTS } from "@/lib/google-fonts.mjs";

const GOOGLE_FONTS_URL = "https://www.googleapis.com/webfonts/v1/webfonts";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.GOOGLE_FONTS_API_KEY)
    return NextResponse.json({ fonts: FALLBACK_FONTS, fallback: true });

  try {
    const response = await fetch(
      `${GOOGLE_FONTS_URL}?key=${encodeURIComponent(env.GOOGLE_FONTS_API_KEY)}&sort=popularity`,
      { next: { revalidate: 86_400 } },
    );
    if (!response.ok)
      return NextResponse.json({ error: "Google Fonts could not be loaded." }, { status: 502 });
    const data = await response.json();
    const fonts = Array.isArray(data.items)
      ? data.items.map(({ family, category }) => ({ family, category }))
      : [];
    return NextResponse.json({ fonts });
  } catch {
    return NextResponse.json({ error: "Google Fonts could not be loaded." }, { status: 502 });
  }
}
