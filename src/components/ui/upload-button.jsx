"use client";

import { useUploadThing } from "@/utils/uploadthing";
import { ImageIcon, Loader } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "./button";

export function UploadButton({ onSuccess, disabled }) {
	const [isUploading, setIsUploading] = useState(false);

	const { startUpload, permittedFileTypes } = useUploadThing("imageUploader", {
		onClientUploadComplete: (res) => {
			setIsUploading(false);
			if (onSuccess) {
				onSuccess(res);
			}
		},
		onUploadError: (error) => {
			setIsUploading(false);
			console.error("Upload error:", error);
			// You might want to add toast notification here
			toast.error("Upload failed");
		},
		onUploadBegin: () => {
			setIsUploading(true);
		},
	});

	const handleFileChange = useCallback(
		async (e) => {
			const files = e.target.files;
			if (!files || files.length === 0) return;

			try {
				await startUpload(Array.from(files));
			} catch (err) {
				console.error("Upload failed:", err);
				setIsUploading(false);
			}
		},
		[startUpload],
	);

	return (
		<div className="flex items-center gap-4 absolute top-0 right-0 w-full h-full">
			<Button
				className="opacity-35 hover:opacity-55 w-full h-full p-0 bg-white border-black hover:border-2 border-dotted transition-all duration-300 ease-in-out"
				variant="ghost"
				disabled={isUploading || disabled}
				onClick={() => document.getElementById("file-input").click()}
			>
				{isUploading ? (
					<Loader className="animate-spin w-12 h-12" />
				) : (
					<ImageIcon className="w-12 h-12" />
				)}
			</Button>
			<input
				id="file-input"
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	);
}
