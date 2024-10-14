"use client";

import { UploadButton } from "@/utils/uploadthing";
import toast from "react-hot-toast";

export default function UploadImage({ onSuccess }) {
	const handleUploadError = (error) => {
		console.log(`Upload failed: ${error.message}`);
		toast.error("Upload Logo failed!");
	};

	return (
		<div>
			<UploadButton
				endpoint="imageUploader"
				onClientUploadComplete={onSuccess}
				onUploadError={handleUploadError}
			/>
		</div>
	);
}
