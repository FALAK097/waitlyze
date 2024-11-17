"use client";

import { cn } from "@/lib/utils";
import { UploadDropzone } from "@/utils/uploadthing";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UploadImage({ onSuccess }) {
	const [isDragging, setIsDragging] = useState(false);

	const handleUploadError = (error) => {
		console.log(`Upload failed: ${error.message}`);
		toast.error("Failed to Upload Logo", {
			description: "Please try again",
		});
	};

	return (
		<div className="space-y-4">
			<UploadDropzone
				appearance={{
					button:
						"ut-ready:bg-primary ut-uploading:cursor-not-allowed rounded-md px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm",
					container: cn(
						"flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 px-6 py-8 text-center transition-all duration-150 hover:bg-muted/50",
						isDragging && "border-primary/50 bg-primary/5",
					),
					allowedContent: "text-sm text-muted-foreground mt-2",
				}}
				endpoint="imageUploader"
				onClientUploadComplete={onSuccess}
				onUploadError={handleUploadError}
				onDragOver={() => setIsDragging(true)}
				onDragLeave={() => setIsDragging(false)}
				content={{
					label: (
						<div className="grid gap-2">
							<div className="grid gap-1">
								<span className="text-sm font-medium text-muted-foreground hover:text-primary">
									Drag & Drop your logo or{" "}
									<span className="text-primary hover:text-primary/90">
										Browse Files
									</span>
								</span>
							</div>
						</div>
					),
				}}
			/>
		</div>
	);
}
