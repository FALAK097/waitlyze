import { FormPreview } from "@/components/wait-lists/preview";
import prisma from "@/lib/prisma";
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

	return (
		<div>
			<FormPreview waitList={waitList} />
		</div>
	);
}
