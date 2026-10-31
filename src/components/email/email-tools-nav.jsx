import Link from "next/link";

import { cn } from "@/lib/utils";

const scope = "min-w-0 bg-white text-product-text-primary";
const navLink =
  "inline-block min-h-10 border-b-2 border-transparent py-2 font-medium text-product-text-secondary no-underline transition-colors hover:text-product-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-success-text! motion-reduce:transition-none";
const navLinkCurrent = "border-product-accent-solid text-product-text-primary";

export function EmailToolsNav({ waitListId, current, action }) {
  const root = `/waitlists/${waitListId}/emails`;
  return (
    <div className={`${scope} mb-6.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3`}>
      <nav
        aria-label="Email tools"
        className="no-scrollbar flex min-w-0 items-center gap-5.5 overflow-x-auto"
      >
        <Link
          prefetch={false}
          href={root}
          aria-current={current === "templates" ? "page" : undefined}
          className={cn(navLink, current === "templates" && navLinkCurrent)}
        >
          Templates
        </Link>
        <Link
          prefetch={false}
          href={`${root}/broadcasts`}
          aria-current={current === "broadcasts" ? "page" : undefined}
          className={cn(navLink, current === "broadcasts" && navLinkCurrent)}
        >
          Broadcasts
        </Link>
        <Link
          prefetch={false}
          href={`${root}/automations`}
          aria-current={current === "automations" ? "page" : undefined}
          className={cn(navLink, current === "automations" && navLinkCurrent)}
        >
          Automations
        </Link>
        <Link
          prefetch={false}
          href={`${root}/logs`}
          aria-current={current === "logs" ? "page" : undefined}
          className={cn(navLink, current === "logs" && navLinkCurrent)}
        >
          Logs
        </Link>
      </nav>
      {action ? (
        <div className="shrink-0 max-sm:order-last max-sm:w-full max-sm:[&_button]:w-full">
          {action}
        </div>
      ) : null}
    </div>
  );
}
