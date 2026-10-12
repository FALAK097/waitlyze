"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Key02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ApiKeysClient } from "@/components/api-keys-client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ResendIntegration } from "./resend-integration";
import "./integrations-panel.css";

export function IntegrationsPanel({ initialConnection, accountEmail, canManage }) {
  const [keysOpen, setKeysOpen] = useState(false);
  return <div className="settings-integrations">
    <Sheet open={keysOpen} onOpenChange={setKeysOpen}>
    <div className="settings-integration-toolbar">
      <div><Button variant="ghost" render={<Link href="/docs" />}>View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" /></Button>{canManage && <SheetTrigger render={<Button variant="outline" />}><HugeiconsIcon icon={Key02Icon} size={16} aria-hidden="true" /> API keys</SheetTrigger>}</div>
    </div>
    <ResendIntegration initialConnection={initialConnection} accountEmail={accountEmail} canManage={canManage} logo={<Image src="/integrations/resend.svg" width={32} height={32} alt="" />} />
    <SheetContent>
      <SheetHeader><SheetTitle>API keys</SheetTitle><SheetDescription>Create a key for one waitlist. Secrets are shown only once.</SheetDescription></SheetHeader>
      <div className="p-6 pt-0">
      {keysOpen && <ApiKeysClient />}
      </div>
    </SheetContent>
    </Sheet>
  </div>;
}
