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
import EmptyWaitlistState from "@/components/wait-lists/empty-waitlist-state";
import { WaitListCard } from "@/components/wait-lists/wait-list-card";
import prisma from "@/lib/prisma";
import { waitFor } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { removeUpload } from "../../actions/removeUpload";

export const metadata = {
	title: "WaitLists",
	description:
		"View and manage all your waitlists, track signups, and analyze performance metrics. Create new waitlists or edit existing ones to optimize your audience engagement.",
};

export default async function WaitListsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		redirect("/");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: session.user.id,
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
			const waitList = await prisma.waitList.findUnique({
				where: {
					id: waitListId,
					userId: user.id,
				},
				select: {
					logoKey: true,
				},
			});

			if (!waitList) {
				response.message = "Wait list not found.";
				return response;
			}

			// Attempt to delete the logo from R2
			const removeUploadResponse = await removeUpload(waitList.logoKey);

			if (removeUploadResponse.success) {
				// Proceed to delete the waitlist entry from the database
				await prisma.waitList.delete({
					where: {
						id: waitListId,
						userId: user.id,
					},
				});
				response.success = true;
				response.message = "Wait list deleted successfully";
			} else {
				response.message = "Failed to delete logo from storage.";
			}
		} catch (error) {
			console.error("Error deleting wait list:", error);
			response.message = "Error deleting wait list";
		}

		await waitFor(1000);
		return response;
	};

	return (
		<ContentLayout title="All WaitLists">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/dashboard">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>All WaitLists</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			{waitLists.length > 0 && (
				<div className="flex justify-end mb-6">
					<Link
						href="/wait-lists/new"
						className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
					>
						Create Waitlist
					</Link>
				</div>
			)}
			{waitLists.length === 0 ? (
				<EmptyWaitlistState />
			) : (
				<div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
					{waitLists.map((waitList) => (
						<WaitListCard
							key={waitList.id}
							id={waitList.id}
							logoUrl={waitList.logoUrl}
							logoKey={waitList.logoKey}
							name={waitList.name}
							deleteWaitList={deleteWaitList}
							description={waitList.description}
							url={`/wait-lists/${waitList.id}/edit`}
						/>
					))}
				</div>
			)}
		</ContentLayout>
	);
}
