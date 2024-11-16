import { ContentLayout } from "@/components/dashboard/content-layout";
import DashboardCard from "@/components/dashboard/dashboard-card";
import { SelectWaitlist } from "@/components/dashboard/select-waitlist";
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
import Link from "next/link";
import { redirect } from "next/navigation";

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

	const waitLists = await prisma.waitList.findMany({
		where: {
			userId: user.id,
		},
	});

	const waitListIds = user.waitLists.map((waitList) => waitList.id);

	return (
		<>
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
		</>
	);
}
