"use client";

import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Suspense } from "react";

function DashboardAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

export default function DashboardLayout({ children }) {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  const { data: session } = useSession();
  const user = session?.user;
  const isSignedIn = !!session;
  const userId = user?.id;
  const posthog = usePostHog();

  useEffect(() => {
    if (isSignedIn && userId && user && !posthog._isIdentified()) {
      posthog.identify(userId, {
        email: user.email,
        name: user.name,
      });
    }
  }, [posthog, user, isSignedIn, userId]);

  if (!sidebar) return null;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh-56px)] bg-background transition-[margin-left] ease-in-out duration-300",
          sidebar?.isOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        <Suspense fallback={null}>
          <DashboardAnalytics />
        </Suspense>
        {children}
      </main>
    </>
  );
}
