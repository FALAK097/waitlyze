import Link from "next/link";
import { Geist } from "next/font/google";
import { PrimaryNav } from "@/components/product/primary-nav";
import { Avatar } from "@/components/product/avatar";
import { currentWorkspace } from "@/lib/workspaces/current";
import "@/components/product/shell.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-product-sans" });
export const metadata = { title: { template: "%s | Waitlyze", default: "Waitlists | Waitlyze" } };

export default async function AppLayout({ children }) {
  const { user } = await currentWorkspace();
  return <div className={`product-ui product-shell ${geist.variable}`}>
    <a className="product-skip-link" href="#product-content">Skip to content</a>
    <header className="product-topbar"><div className="product-topbar-inner">
      <Link className="product-wordmark" href="/wait-lists">Waitlyze<span aria-hidden="true">.</span></Link>
      <PrimaryNav />
      <Link className="product-account-link" href="/settings#profile" aria-label="Account settings"><Avatar id={user.id} src={user.image || user.imageUrl} size={32} /></Link>
    </div></header>
    <main id="product-content" tabIndex={-1} className="product-main">{children}</main>
  </div>;
}
