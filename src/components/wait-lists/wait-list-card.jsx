"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Delete2Icon, SquarePenIcon, CopyIcon } from "../shared/icons";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";

export const WaitListCard = ({
	id,
	name,
	url,
	logoUrl,
	description,
	deleteWaitList,
}) => {
	const { push, refresh } = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleRedirect = () => {
		push(url);
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		const response = await deleteWaitList(id);
		if (response.success) {
			setIsDeleting(false);
			setIsDeleteDialogOpen(false);
			toast.success(response.message);
			setTimeout(() => {
				refresh();
			}, 1000);
		} else {
			setIsDeleting(false);
			toast.error("There was an error deleting the wait list");
		}
	};

	const handleCopyId = async () => {
		try {
			await navigator.clipboard.writeText(id);
			toast.success("ID copied to clipboard");
		} catch (error) {
			toast.error("Failed to copy ID");
		}
	};

	return (
		<>
			<Card className="relative w-full transition-all group hover:shadow-lg">
				<button
					onClick={handleCopyId}
					className="absolute z-10 p-1 transition-colors duration-200 rounded-sm top-3 right-3 hover:bg-muted"
					title="Copy ID"
				>
					<CopyIcon />
				</button>
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
					<CardDescription className="line-clamp-2 min-h-10">
						{description ?? "No description provided"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="w-full h-px from-transparent to-transparent bg-linear-to-r via-muted" />
				</CardContent>
				<CardFooter className="grid grid-cols-2 gap-2">
					<Button
						onClick={handleRedirect}
						variant="secondary"
						className="w-full gap-2"
					>
						<SquarePenIcon className="size-4" />
						Edit
					</Button>
					<Button
						disabled={isDeleting}
						onClick={() => setIsDeleteDialogOpen(true)}
						variant="destructive"
						className="w-full gap-2"
					>
						<Delete2Icon className="size-4" />
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</CardFooter>
			</Card>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent className="rounded-xl sm:max-w-[425px]">
					<DialogHeader className="space-y-2">
						<DialogTitle>Delete WaitList</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <b>{name}</b>? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							className="flex-1"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
