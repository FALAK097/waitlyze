import { FormPreview } from "@/components/wait-lists/preview";
import prisma from "@/lib/prisma";
import { ReactQueryProvider } from "@/providers/query";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function WaitListsPreviewPage({ params }) {
	const { id } = params;

	const waitList = await prisma.waitList.findUnique({
		where: {
			id: id,
		},
	});

	if (!waitList) {
		return notFound();
	}

	const cookieStore = cookies();

	const hypeSession = cookieStore.get("hypeSession");

	if (!hypeSession) {
		cookieStore.set("hypeSession", nanoid(), {
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	}

	const storeImpression = async () => {
		await prisma.impression.create({
			data: {
				waitListId: id,
				uniqueUserId: hypeSession,
			},
		});
	};

	return (
		<div>
			<ReactQueryProvider>
				<FormPreview uniqueUserId={hypeSession} waitList={waitList} />
			</ReactQueryProvider>
		</div>
	);
}
