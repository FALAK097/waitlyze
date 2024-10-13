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
import { NewWaitListForm } from "@/components/wait-lists/new-form";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export default async function WaitListsPage() {
	const clerkUser = await currentUser();
	const user = await prisma.user.findUnique({
		where: {
			clerkUserId: clerkUser.id,
		},
	});

	const createNewWaitList = async (values) => {
		"use server";
		const response = {
			success: false,
			message: "",
			waitList: null,
		};

		try {
			const waitList = await prisma.waitList.create({
				data: {
					...values,
					userId: user.id,
				},
			});
			console.log("Wait list created successfully");
			response.success = true;
			response.message = "Wait list created successfully";
			response.waitList = {
				id: waitList.id,
			};
		} catch (error) {
			console.error("Error creating wait list:", error);
			response.message = "Error creating wait list";
		}
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
			<NewWaitListForm createNewWaitList={createNewWaitList} />
		</ContentLayout>
	);
}
