import { FormPreview } from "@/components/wait-lists/preview";
import prisma from "@/lib/prisma";
import { ReactQueryProvider } from "@/providers/query";
import { nanoid } from "nanoid";
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

	const uniqueUserId = nanoid();

	return (
		<div>
			<ReactQueryProvider>
				<FormPreview uniqueUserId={uniqueUserId} waitList={waitList} />
			</ReactQueryProvider>
		</div>
	);
}
