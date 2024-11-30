import { FormPreview } from "@/components/wait-lists/preview";
import prisma from "@/lib/prisma";
import { ReactQueryProvider } from "@/providers/query";
import { nanoid } from "nanoid";
import { notFound } from "next/navigation";
import { cache } from "react";

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

export async function generateMetadata({ params }) {
	const { id } = params;

	const waitList = await getWaitListMetadata(id);

	if (!waitList) {
		return {
			title: "Not Found, Check the URL and try again",
			description: "The requested waitlist could not be found.",
		};
	}

	return {
		title: waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1),
		description:
			waitList.description ||
			"Preview and test your waitlist form before sharing it with your audience.",
	};
}

export default async function WaitListsPreviewPage({ params }) {
	const { id } = params;

	const waitList = await getWaitList(id);

	if (!waitList) {
		return notFound();
	}

	const uniqueUserId = nanoid();

	const getTotalSignUpsOnWaitList = async () => {
		"use server";
		return getSignUpsCount(waitList.id);
	};

	return (
		<div>
			<ReactQueryProvider>
				<FormPreview
					uniqueUserId={uniqueUserId}
					waitList={waitList}
					getTotalSignUpsOnWaitList={getTotalSignUpsOnWaitList}
				/>
			</ReactQueryProvider>
		</div>
	);
}
