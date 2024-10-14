"use client";

import { UploadButton } from "@/utils/uploadthing";
import { useState } from "react";

export default function UploadImage() {
	const [error, setError] = useState(null);

	const handleUploadError = (error) => {
		setError(`Upload failed: ${error.message}`);
	};

	return (
		<div>
			{error && <div className="error">{error}</div>}
			<UploadButton
				endpoint="imageUploader"
				onClientUploadComplete={(res) => {
					console.log("Files: ", res);
					alert("Upload Completed");
				}}
				onUploadError={handleUploadError}
			/>
		</div>
	);
}
