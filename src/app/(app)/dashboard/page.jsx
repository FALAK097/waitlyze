import { getDashboardData } from "@/actions/dashboard-data";
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
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
  title: "Dashboard",
  description:
    "Get detailed analytics and insights about your waitlists, track signups, and understand your audience better with Waitlyze's powerful dashboard.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { success, data } = await getDashboardData();

  if (!success || !data) {
    redirect("/");
  }

  const updateOnboardingStatus = async (userId) => {
    "use server";
    await prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });
    revalidatePath("/dashboard");
  };

  return (
    <div className="flex flex-col gap-8">
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
        <DashboardCard waitListIds={data.waitListIds} />
      </Suspense>
    </div>
  );
}
