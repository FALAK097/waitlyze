import Link from "next/link";

import { ContentLayout } from "@/components/dashboard/content-layout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WaitListCard } from "@/components/wait-lists/wait-list-card";
import prisma from "@/lib/prisma";
import { waitFor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function WaitListsPage() {
	const clerkUser = await currentUser();
	if (!clerkUser) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}

	const user = await prisma.user.findUnique({
		where: {
			clerkUserId: clerkUser.id,
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

	const deleteWaitList = async (waitListId) => {
		"use server";
		const response = {
			success: false,
			message: "Failed to delete wait list",
		};

		try {
			await prisma.waitList.delete({
				where: {
					id: waitListId,
					userId: user.id,
				},
			});
			response.success = true;
			response.message = "Wait list deleted successfully";
		} catch (error) {
			console.error("Error deleting wait list:", error);
			response.message = "Error deleting wait list";
		}
		await waitFor(1000);
		return response;
	};

	return (
		<ContentLayout title="Dashboard">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/dashboard">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>All Wait Lists</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			{waitLists.map((waitList) => (
				<div key={waitList.id}>
					<WaitListCard
						id={waitList.id}
						logoUrl={waitList.logoUrl}
						name={waitList.name}
						deleteWaitList={deleteWaitList}
						description={waitList.description}
						url={`/wait-lists/${waitList.id}`}
					/>
				</div>
			))}
		</ContentLayout>
	);
}
