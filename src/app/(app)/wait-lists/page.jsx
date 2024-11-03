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
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { removeUpload } from "../../actions/removeUpload";

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
			const waitList = await prisma.waitList.findUnique({
				where: {
					id: waitListId,
					userId: user.id,
				},
				select: {
					logoKey: true, // Get the logoKey associated with the waitlist
				},
			});

			if (!waitList) {
				response.message = "Wait list not found.";
				return response;
			}

			// Attempt to delete the logo from Uploadthing
			const removeUploadResponse = await removeUpload(waitList.logoKey);
			console.log("Uploadthing response:", removeUploadResponse); // Log the response for debugging

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
				response.message = "Failed to delete logo from Uploadthing.";
			}
		} catch (error) {
			console.error("Error deleting wait list:", error);
			response.message = "Error deleting wait list";
		}

		await waitFor(1000); // Delay before returning the response
		return response;
	};

	return (
		<ContentLayout title="All Wait Lists">
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
