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

export default async function WaitListsEditPage({ params }) {
	const { id } = params;
	const clerkUser = await currentUser();
	const user = await prisma.user.findUnique({
		where: {
			clerkUserId: clerkUser.id,
		},
	});

	if (!user) {
		return notFound();
	}

	if (!id) {
		return notFound();
	}

	const waitList = await prisma.waitList.findUnique({
		where: {
			id: id,
			userId: user.id,
		},
	});

	if (!waitList) {
		return notFound();
	}

	const saveWaitList = async (waitListId, waitList) => {
		"use server";
		let response = {
			success: false,
			waitList: null,
			message: "Failed to save wait list",
		};
		const data = {
			buttonColor: waitList.buttonColor,
			buttonBorder: waitList.buttonBorder,
			buttonTextColor: waitList.buttonTextColor,
			mainBgColor: waitList.mainBgColor,
			bgColor: waitList.bgColor,
			borderWidth: waitList.borderWidth,
			borderRadius: waitList.borderRadius,
			fontWeight: waitList.fontWeight,
			logoSize: waitList.logoSize,
			buttonText: waitList.buttonText,
			successMessage: waitList.successMessage,
			showLogo: waitList.showLogo,
			showSocialProof: waitList.showSocialProof,
			enableReferrals: waitList.enableReferrals,
			inputColor: waitList.inputColor,
			inputBorder: waitList.inputBorder,
			inputTextColor: waitList.inputTextColor,
			placeholderText: waitList.placeholderText,
			logoUrl: waitList.logoUrl,
			logoKey: waitList.logoKey,
		};
		try {
			const waitList = await prisma.waitList.update({
				where: {
					id: waitListId,
				},
				data: {
					...data,
				},
			});

			response = {
				success: true,
				waitList: waitList,
				message: "Wait list saved successfully",
			};
		} catch (error) {
			console.error(error);
		}
		return response;
	};

	return (
		<ContentLayout title="Wait Lists">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/dashboard">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/wait-lists">Wait Lists</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbPage>{waitList.name}</BreadcrumbPage>
				</BreadcrumbList>
			</Breadcrumb>
			<WaitlistGenerator
				initialWaitList={waitList}
				saveWaitList={saveWaitList}
			/>
		</ContentLayout>
	);
}
