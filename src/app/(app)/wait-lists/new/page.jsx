import Link from "next/link";
import { Suspense } from "react";

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
import { waitFor } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata = {
	title: "Create New WaitList",
	description:
		"Create a beautiful, customizable waitlist page to collect signups and build anticipation for your product launch. Configure colors, text, and settings to match your brand.",
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
		return notFound();
	}

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
			response.success = true;
			response.message = "Wait list created successfully";
			response.waitList = {
				id: waitList.id,
			};
		} catch (error) {
			console.error("Error creating wait list:", error);
			response.message = "Error creating wait list";
		}
		await waitFor(1000);
		return response;
	};

	return (
		<ContentLayout title="New WaitList">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/dashboard">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>New WaitList</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<Suspense fallback={<div>Loading form...</div>}>
				<NewWaitListForm createNewWaitList={createNewWaitList} />
			</Suspense>
		</ContentLayout>
	);
}
