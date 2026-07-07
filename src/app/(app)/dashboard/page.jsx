import { getDashboardData } from "@/actions/dashboard-data";
import { updateOnboardingStatus } from "@/actions/update-onboarding";
import { ContentLayout } from "@/components/dashboard/content-layout";
import DashboardCard from "@/components/dashboard/dashboard-card";
import { SelectWaitlist } from "@/components/dashboard/select-waitlist";
import OnboardingDialog from "@/components/onboarding/onboarding";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const metadata = {
  title: "Dashboard",
  description:
    "Get detailed analytics and insights about your waitlists, track signups, and understand your audience better with Waitlyze's powerful dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const { data } = await getDashboardData(session.user.id);

  return (
    <div className="flex flex-col">
      <OnboardingDialog
        userId={data.user.id}
        isOnboarded={data.user.isOnboarded}
        onComplete={updateOnboardingStatus}
      />
      <ContentLayout title="Dashboard">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Suspense fallback={<div>Loading...</div>}>
            <SelectWaitlist waitLists={data.waitLists} />
          </Suspense>
        </div>
      </ContentLayout>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardCard waitLists={data.waitLists} />
      </Suspense>
    </div>
  );
}
