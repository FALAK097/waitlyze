"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, ArrowUpRight } from "lucide-react";
import { ApiKeysClient } from "@/components/api-keys-client";
import { SideDrawer } from "./side-drawer";
import { ResendIntegration } from "./resend-integration";
import "./integrations-panel.css";

export function IntegrationsPanel({ initialConnection, accountEmail, canManage }) {
  const [keysOpen, setKeysOpen] = useState(false);
  return <div className="settings-integrations">
    <div className="settings-integration-toolbar">
      <div><Link className="product-button product-button-ghost" href="/docs">View docs <ArrowUpRight size={16} aria-hidden="true" /></Link>{canManage && <button type="button" className="product-button product-button-outline" onClick={() => setKeysOpen(true)}><KeyRound size={16} aria-hidden="true" /> API keys</button>}</div>
    </div>
    <ResendIntegration initialConnection={initialConnection} accountEmail={accountEmail} canManage={canManage} logo={<Image src="/integrations/resend.svg" width={32} height={32} alt="" />} />
    <SideDrawer open={keysOpen} onOpenChange={setKeysOpen} title="API keys" description="Create a key for one waitlist. Secrets are shown only once.">
      {keysOpen && <ApiKeysClient />}
    </SideDrawer>
  </div>;
}
