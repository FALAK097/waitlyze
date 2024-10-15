"use client";

import { UploadDropzone } from "@/utils/uploadthing";
import toast from "react-hot-toast";

export default function UploadImage({ onSuccess }) {
	const handleUploadError = (error) => {
		console.log(`Upload failed: ${error.message}`);
		toast.error("Upload Logo failed!");
	};

	return (
		<div>
			<UploadDropzone
				appearance={{
					button:
						"ut-ready:bg-primary ut-uploading:cursor-not-allowed rounded-r-none bg-purple-500 bg-none after:bg-purple-400",
					container: "w-full rounded-md border-primary bg-slate-800",
					allowedContent:
						"flex h-8 flex-col items-center justify-center px-2 text-white",
				}}
				endpoint="imageUploader"
				onClientUploadComplete={onSuccess}
				onUploadError={handleUploadError}
			/>
		</div>
	);
}
