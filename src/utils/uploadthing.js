import {
	generateReactHelpers,
	generateUploadButton,
	generateUploadDropzone,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton();
export const UploadDropzone = generateUploadDropzone();
export const { useUploadThing } = generateReactHelpers();
