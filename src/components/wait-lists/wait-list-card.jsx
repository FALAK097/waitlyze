"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

export const WaitListCard = ({
	id,
	name,
	url,
	description,
	deleteWaitList,
}) => {
	const { push, refresh } = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const handleRedirect = () => {
		push(url);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const response = await deleteWaitList(id);
		if (response.success) {
			setIsDeleting(false);
			toast.success(response.message);
			setTimeout(() => {
				refresh();
			}, 1000);
		} else {
			setIsDeleting(false);
			toast.error("There was an error deleting the wait list");
		}
	};

	return (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>{name}</CardTitle>
				<CardDescription>
					{description ?? "No description given"}
				</CardDescription>
			</CardHeader>
			<CardFooter className="flex justify-between">
				<Button onClick={handleRedirect}>View</Button>
				<Button
					disabled={isDeleting}
					onClick={handleDelete}
					variant="destructive"
				>
					{isDeleting ? "Deleting..." : "Delete"}
				</Button>
			</CardFooter>
		</Card>
	);
};
