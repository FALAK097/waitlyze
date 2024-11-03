"use client";

import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

export const WaitListCard = ({
	id,
	name,
	url,
	logoUrl,
	logoKey,
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
		<Card className="relative w-full transition-all group hover:shadow-lg">
			<CardHeader>
				<CardTitle className="flex items-center gap-4">
					<div className="relative overflow-hidden rounded-lg size-16 bg-muted">
						<Image
							src={logoUrl}
							alt={`${name} logo`}
							fill
							className="object-cover"
							onError={() => setImageError(true)}
						/>
					</div>
					<div className="flex-1 truncate">{name}</div>
				</CardTitle>
				<CardDescription className="line-clamp-2 min-h-[2.5rem]">
					{description ?? "No description provided"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="w-full h-px bg-gradient-to-r from-transparent via-muted to-transparent" />
			</CardContent>
			<CardFooter className="grid grid-cols-2 gap-2">
				<Button
					onClick={handleRedirect}
					variant="secondary"
					className="w-full gap-2"
				>
					<Pencil className="size-4" />
					Edit
				</Button>
				<Button
					disabled={isDeleting}
					onClick={handleDelete}
					variant="destructive"
					className="w-full gap-2"
				>
					<Trash2 className="size-4" />
					{isDeleting ? "Deleting..." : "Delete"}
				</Button>
			</CardFooter>
		</Card>
	);
};
