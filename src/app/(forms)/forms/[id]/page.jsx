import { FormPreview } from "@/components/wait-lists/preview";
import prisma from "@/lib/prisma";
import { ReactQueryProvider } from "@/providers/query";
import { nanoid } from "nanoid";
import { notFound } from "next/navigation";
import { cache } from "react";
import { sendSignupEmail } from "@/app/actions/emails";

const getWaitList = cache(async (id) => {
	return await prisma.waitList.findUnique({
		where: { id },
	});
});

const getWaitListMetadata = cache(async (id) => {
	return await prisma.waitList.findUnique({
		where: { id },
		select: {
			name: true,
			description: true,
			ogTitle: true,
			ogDescription: true,
			ogImage: true,
		},
	});
});

const getSignUpsCount = cache(async (waitListId) => {
	return await prisma.signUp.count({
		where: {
			waitListId,
		},
	});
});

export async function generateMetadata(props) {
	const params = await props.params;
	const { id } = params;

	const waitList = await getWaitListMetadata(id);

	if (!waitList) {
		return {
			title: "Not Found, Check the URL and try again",
			description: "The requested waitlist could not be found.",
		};
	}

	const title =
		waitList.ogTitle ||
		waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1);
	const description =
		waitList.ogDescription ||
		waitList.description ||
		"Preview and test your waitlist form before sharing it with your audience.";

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			...(waitList.ogImage && {
				images: [
					{
						url: waitList.ogImage,
						width: 1200,
						height: 630,
						alt: `${title} Preview`,
					},
				],
			}),
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			...(waitList.ogImage && {
				images: [waitList.ogImage],
			}),
		},
	};
}

export default async function WaitListsPreviewPage(props) {
	const params = await props.params;
	const { id } = params;

	const waitList = await getWaitList(id);

	if (!waitList) {
		return notFound();
	}

	const uniqueUserId = nanoid();
	const initialSignUpsCount = await getSignUpsCount(id);

	const getTotalSignUpsOnWaitList = async (waitListId) => {
		"use server";
		return getSignUpsCount(waitListId);
	};

	const sendSignUpEmailAction = async ({ email }) => {
		"use server";
		if (!email) return { success: false, message: "Missing email" };
		return await sendSignupEmail({ waitListId: id, to: email });
	};


	return (
		<div>
			<ReactQueryProvider>
				<FormPreview
					uniqueUserId={uniqueUserId}
					waitList={waitList}
					initialSignUpsCount={initialSignUpsCount}
					getTotalSignUpsOnWaitList={getTotalSignUpsOnWaitList.bind(null, id)}
					sendSignUpEmailAction={sendSignUpEmailAction}
				/>
			</ReactQueryProvider>
		</div>
	);
}
