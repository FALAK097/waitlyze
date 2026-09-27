import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { FoundationPreview } from "@/components/product/foundation-preview";
import { Avatar } from "@/components/product/avatar";

const sans = Geist({ subsets: ["latin"], variable: "--product-font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--product-font-mono" });
export const dynamic = "force-dynamic";
export const metadata = { title: "Design foundation preview", robots: { index: false, follow: false } };

export default function DesignSystemPage() {
  if (process.env.WAITLYZE_DESIGN_PREVIEW !== "1") notFound();
  return <div className={`${sans.variable} ${mono.variable}`}><FoundationPreview avatar={<Avatar id="fixture-workspace-01" />} /></div>;
}
