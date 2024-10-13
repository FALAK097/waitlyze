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
import { WaitlistGenerator } from "@/components/wait-lists/edit-form";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export default async function WaitListsEditPage({ id }) {
	const clerkUser = await currentUser();
	const user = await prisma.user.findUnique({
		where: {
			clerkUserId: clerkUser.id,
		},
	});

	const waitList = await prisma.waitList.findFirst({
		where: {
			id: id,
			userId: user.id,
		},
	});

	if (!waitList) {
		return notFound();
	}

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
			<WaitlistGenerator />
		</ContentLayout>
	);
}
