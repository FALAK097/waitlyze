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
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

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

	const waitLists = await prisma.waitList.findMany({
		where: {
			userId: user.id,
		},
	});

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
					<h2>{waitList.name}</h2>
					<p>{waitList.websiteUrl}</p>
				</div>
			))}
		</ContentLayout>
	);
}
