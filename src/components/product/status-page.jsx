"use client";

import { ArrowLeft01Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StatusPage({
  code = "404",
  title = "Page not found",
  description = "This link is no longer available. You can start again from the home page.",
  href = "/",
  linkLabel = "Back to home",
  retry,
  standalone = false,
}) {
  const content = (
    <section
      className={cn(
        "product-ui flex min-h-svh flex-col items-center justify-center bg-product-bg-page px-5 pt-8 pb-16 text-center",
        standalone ? "relative min-[700px]:px-12 min-[700px]:pt-8 min-[700px]:pb-20" : "max-h-175",
      )}
      aria-labelledby="status-title"
    >
      {standalone && (
        <Link
          prefetch={false}
          href="/"
          className="mt-0 mb-12 inline-flex items-center self-start font-product-display text-2xl leading-none font-bold tracking-tighter text-product-text-primary no-underline"
          aria-label="Waitlyze home"
        >
          <span className="mr-2 inline-flex h-7 -skew-x-12 items-center gap-1" aria-hidden="true">
            <i className="block h-4 w-1.25 rounded-xs bg-product-accent-solid" />
            <i className="block h-6.5 w-1.25 rounded-xs bg-product-accent-solid" />
            <i className="block h-5 w-1.25 rounded-xs bg-product-accent-solid" />
          </span>
          <span className="inline-flex items-baseline">
            waitlyze
            <span className="text-product-success-text" aria-hidden="true">
              .
            </span>
          </span>
        </Link>
      )}
      <div className="my-auto w-full max-w-135">
        <div className="relative mx-auto mb-6 w-full max-w-90 leading-none" aria-hidden="true">
          <span className="relative z-1 block text-8xl font-semibold tracking-tighter text-product-text-primary md:text-9xl">
            {code}
          </span>
          <svg
            className="absolute top-1/2 -left-2 z-0 h-auto! w-full! -translate-y-1/2 overflow-visible text-product-accent-solid"
            viewBox="0 0 320 160"
            fill="none"
          >
            <path
              d="M14 112C80 48 150 118 218 86C244 74 268 84 298 84"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M278 68l20 16-20 16"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 id="status-title" className="mb-3! text-2xl! md:text-3xl!">
          {title}
        </h1>
        <p className="mx-auto! max-w-sm text-product-text-secondary">{description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {retry && (
            <Button onClick={retry}>
              <HugeiconsIcon icon={RotateLeft01Icon} size={16} aria-hidden="true" />
              Try again
            </Button>
          )}
          <Button
            variant={retry ? "ghost" : "default"}
            render={<Link prefetch={false} href={href} />}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            {linkLabel}
          </Button>
        </div>
      </div>
    </section>
  );
  return standalone ? <main>{content}</main> : content;
}
