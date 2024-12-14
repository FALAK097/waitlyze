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
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
	title: "Dashboard",
	description:
		"Get detailed analytics and insights about your waitlists, track signups, and understand your audience better with HypeItUp's powerful dashboard.",
};

export default async function DashboardPage() {
	const clerkUser = await currentUser();

	if (!clerkUser) {
		redirect("/");
	}

	const user = await prisma.user.findUnique({
		where: {
			clerkUserId: clerkUser.id,
		},
		include: {
			waitLists: true,
		},
	});

	if (!user) {
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

	const waitLists = await prisma.waitList.findMany({
		where: {
			userId: user.id,
		},
	});

	const waitListIds = user.waitLists.map((waitList) => waitList.id);

	return (
		<div className="flex flex-col gap-8">
			<OnboardingDialog
				userId={user.id}
				isOnboarded={user.isOnboarded}
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

					<SelectWaitlist waitLists={waitLists} />
				</div>
			</ContentLayout>

			<DashboardCard waitListIds={waitListIds} />
		</div>
	);
}
