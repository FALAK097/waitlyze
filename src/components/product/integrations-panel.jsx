"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ResendIntegration } from "./resend-integration";

export function IntegrationsPanel({ initialConnection, accountEmail, canManage, appOrigin }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h2 id="settings-panel-heading" className="mb-2! text-2xl!">
            Integrations
          </h2>
          <p className="m-0 text-product-text-secondary">Connect the tools your waitlists use.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4 max-[600px]:gap-2">
          <Button
            variant="ghost"
            render={
              <Link
                prefetch={false}
                href="/docs/integrations/overview"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            View docs <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <ResendIntegration
        initialConnection={initialConnection}
        accountEmail={accountEmail}
        canManage={canManage}
        appOrigin={appOrigin}
        logo={
          <Image
            src="/integrations/resend.svg"
            width={32}
            height={32}
            alt=""
            unoptimized
            className="shrink-0 bg-transparent outline-none"
          />
        }
      />
    </div>
  );
}
