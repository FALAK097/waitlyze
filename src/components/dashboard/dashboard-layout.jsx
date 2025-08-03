"use client";

import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@clerk/nextjs";
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
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (isSignedIn && userId && user && !posthog._isIdentified()) {
      posthog.identify(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username,
      });
    }
  }, [posthog, user]);

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
