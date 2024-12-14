import Link from "next/link";
import { cache } from "react";

import { ClientOnly } from "@/components/client-only";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Laptop } from "lucide-react";
import { notFound } from "next/navigation";

const getWaitList = cache(async (id) => {
	return await prisma.waitList.findUnique({
		where: { id },
		select: { name: true },
	});
});

const getFullWaitList = cache(async (id, userId) => {
	return await prisma.waitList.findUnique({
		where: {
			id,
			userId,
		},
	});
});

const getUser = cache(async (clerkUserId) => {
	return await prisma.user.findUnique({
		where: { clerkUserId },
	});
});

export async function generateMetadata({ params }) {
	const { id } = params;
	const waitList = await getWaitList(id);

	if (!waitList) {
		return {
			title: "Not Found | HypeItUp",
			description: "The requested waitlist could not be found.",
		};
	}

	return {
		title: `Edit ${waitList.name}`,
		description:
			"Customize your waitlist's appearance, configure settings like colors and text, and preview changes in real-time to create the perfect signup form",
	};
}

export default async function WaitListsEditPage({ params }) {
	const { id } = params;
	const clerkUser = await currentUser();

	if (!id || !clerkUser) {
		return notFound();
	}

	const user = await getUser(clerkUser.id);

	if (!user) {
		return notFound();
	}

	const waitList = await getFullWaitList(id, user.id);

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
			mainBgColor: waitList.enableMainBgColor ? waitList.mainBgColor : null,
			enableMainBgColor: waitList.enableMainBgColor,
			bgColor: waitList.bgColor,
			enableBgColor: waitList.enableBgColor,
			borderWidth: waitList.borderWidth,
			borderRadius: waitList.borderRadius,
			fontWeight: waitList.fontWeight,
			logoSize: waitList.logoSize,
			buttonText: waitList.buttonText,
			successMessage: waitList.successMessage,
			showLogo: waitList.showLogo,
			showSocialProof: waitList.showSocialProof,
			showBadge: waitList.showBadge,
			badgeColor: waitList.badgeColor,
			badgeText: waitList.badgeText,
			badgeTextColor: waitList.badgeTextColor,
			enableReferrals: waitList.enableReferrals,
			inputColor: waitList.inputColor,
			inputBorder: waitList.inputBorder,
			inputTextColor: waitList.inputTextColor,
			placeholderText: waitList.placeholderText,
			logoUrl: waitList.logoUrl,
			logoKey: waitList.logoKey,
			shareOnTwitter: waitList.shareOnTwitter,
			shareOnWhatsapp: waitList.shareOnWhatsapp,
			shareOnInstagram: waitList.shareOnInstagram,
			shareOnFacebook: waitList.shareOnFacebook,
			shareOnLinkedin: waitList.shareOnLinkedin,
			shareOnEmail: waitList.shareOnEmail,
			shareOnReddit: waitList.shareOnReddit,
			ogTitle: waitList.ogTitle,
			ogDescription: waitList.ogDescription,
			ogImage: waitList.ogImage,
		};

		try {
			const updatedWaitList = await prisma.waitList.update({
				where: { id: waitListId },
				data,
			});

			response = {
				success: true,
				waitList: updatedWaitList,
				message: "Wait list saved successfully",
			};
		} catch (error) {
			console.error(error);
		}

		return response;
	};

	return (
		<ContentLayout title="WaitLists">
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
							<Link href="/wait-lists">WaitLists</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbPage>
						{waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)}
					</BreadcrumbPage>
				</BreadcrumbList>
			</Breadcrumb>

			<ClientOnly>
				<div className="mt-4 mb-4 md:hidden">
					<Alert className="border-yellow-200 bg-yellow-50">
						<Laptop className="w-4 h-4 text-yellow-600" />
						<AlertDescription className="ml-2 text-yellow-800">
							For the best experience customizing your waitlist, we recommend
							using a desktop or laptop computer.
						</AlertDescription>
					</Alert>
				</div>
			</ClientOnly>

			<WaitlistGenerator
				initialWaitList={waitList}
				saveWaitList={saveWaitList}
			/>
		</ContentLayout>
	);
}
