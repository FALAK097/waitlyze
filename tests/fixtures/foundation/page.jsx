import "@/../tests/fixtures/foundation/fixture.css";
import "@/components/product/foundation.css";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { FoundationPreview } from "@/../tests/fixtures/foundation/preview";
import { Avatar } from "@/components/product/avatar";

const sans = Geist({ subsets: ["latin"], variable: "--product-font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--product-font-mono" });
export const dynamic = "force-dynamic";
export const metadata = { title: "Design foundation preview", robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  if (process.env.WAITLYZE_TEST_FIXTURE !== "1") notFound();
  return <div className={`${sans.variable} ${mono.variable}`}><FoundationPreview avatar={<Avatar id="fixture-workspace-01" />} /></div>;
}
