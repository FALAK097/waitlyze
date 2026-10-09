import { requireCampaign, requireCampaignPage } from "@/lib/workspaces/authorize";
import { cache } from "react";

import { ClientOnly } from "@/components/client-only";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { WaitlistGenerator } from "@/components/wait-lists/edit-form";
import { SnapshotPageBuilder } from "@/components/product/snapshot-page-builder";
import { saveDraftPage } from "@/app/actions/draft-snapshot";
import { publishWaitlist, pauseWaitlist, rollbackWaitlist } from "@/app/actions/publication";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Laptop } from "lucide-react";
import { notFound, redirect } from "next/navigation";

const getUser = cache(async (id) => {
	return await prisma.user.findUnique({
		where: { id },
	});
});

export const metadata = { title: "Page" };

export default async function WaitListsEditPage(props) {
	const params = await props.params;
	const { id } = params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!id || !session) {
		redirect("/");
	}

	const user = await getUser(session.user.id);

	if (!user) {
		return notFound();
	}

	const { campaign: waitList } = await requireCampaignPage(id, "editCampaign");

	if (!waitList) {
		return notFound();
	}
	const publicationMember = waitList.workspaceId ? await prisma.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId: waitList.workspaceId, userId: user.id } },
		select: { role: true },
	}) : null;
	const canPublish = publicationMember ? ["OWNER", "ADMIN"].includes(publicationMember.role) : waitList.userId === user.id;

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
			sendEmailsToSubscribers: waitList.sendEmailsToSubscribers,
			showLogo: waitList.showLogo,
			showSocialProof: waitList.showSocialProof,
			showBadge: waitList.showBadge,
			badgeColor: waitList.badgeColor,
			badgeText: waitList.badgeText,
			badgeTextColor: waitList.badgeTextColor,
			showReferrals: waitList.showReferrals,
			showBranding: waitList.showBranding,
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
			const { user: actor, campaign, scope } = await requireCampaign(waitListId, "editCampaign");
            if (data.logoKey && data.logoKey !== campaign.logoKey && !data.logoKey.startsWith(`${actor.id}-`)) throw new Error("Invalid image key");
            let mutationScope = scope;
            if (data.sendEmailsToSubscribers !== campaign.sendEmailsToSubscribers) {
              mutationScope = (await requireCampaign(waitListId, "sendEmail")).scope;
            } else {
              // Do not overwrite a concurrent privileged change with an unchanged form value.
              delete data.sendEmailsToSubscribers;
            }
            const updatedWaitList = await prisma.waitList.update({
				where: { id: waitListId, ...mutationScope },
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

	if (waitList.templateSnapshot) {
		return <ContentLayout title="Page"><SnapshotPageBuilder waitList={{ id: waitList.id, name: waitList.name, publicSlug: waitList.publicSlug, status: waitList.status, templateRevision: waitList.templateRevision, publishedRevision: waitList.publishedRevision, publishedTemplateRevision: waitList.publishedTemplateRevision, templateSnapshot: waitList.templateSnapshot }} saveDraftPage={saveDraftPage} publishPage={publishWaitlist} pausePage={pauseWaitlist} rollbackPage={rollbackWaitlist} canPublish={canPublish} /></ContentLayout>;
	}

	return (
		<ContentLayout title="WaitLists">


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
