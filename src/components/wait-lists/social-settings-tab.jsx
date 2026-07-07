"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { SharingOptions } from "@/components/wait-lists/sharing-options";
import { useR2Upload } from "@/utils/r2-upload";
import { X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "react-hot-toast";

export function SocialSettingsTab({ formSettings, updateSetting }) {
	const fileInputRef = useRef(null);
	const { startUpload, isUploading } = useR2Upload("imageUploader", {
		onClientUploadComplete: (res) => {
			if (res?.[0]?.url) {
				updateSetting("ogImage", res[0].url);
				toast.success("Image uploaded successfully");
			}
		},
		onUploadError: (error) => {
			toast.error(`ERROR! ${error.message}`);
		},
	});

	const handleFileChange = async (e) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			try {
				await startUpload([files[0]]);
			} catch (err) {
				console.error(err);
			}
		}
	};

	return (
		<TabsContent value="social" className="py-4 space-y-4">
			<div className="space-y-6">
				<div className="space-y-4">
					<h3 className="font-medium">Open Graph Settings</h3>
					<p className="text-sm text-muted-foreground">
						These settings control how your waitlist appears when shared on
						social media.
					</p>
					<div className="space-y-2">
						<Label htmlFor="title">OG Title</Label>
						<p className="text-sm text-muted-foreground">
							This will be the title that shows up on social media when
							users share your waitlist.
						</p>
						<Input
							id="title"
							placeholder="Join the waitlist"
							value={formSettings.ogTitle}
							onChange={(e) => updateSetting("ogTitle", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">OG Description</Label>
						<p className="text-sm text-muted-foreground">
							This will be the description that shows up on social media
							when users share your waitlist.
						</p>
						<Input
							id="description"
							placeholder="Join the waitlist to get early access"
							value={formSettings.ogDescription}
							onChange={(e) =>
								updateSetting("ogDescription", e.target.value)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="image">OG Image</Label>
						<p className="text-sm text-muted-foreground">
							This will be the image that shows up on social media when
							users share your waitlist.
						</p>
						<div className="grid w-full max-w-sm items-start gap-1.5">
							{formSettings.ogImage && (
								<div className="space-y-2">
									<div className="flex justify-end">
										<Button
											variant="destructive"
											size="icon"
											className="w-6 h-6"
											onClick={() => updateSetting("ogImage", "")}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
									<div className="relative w-full overflow-hidden rounded-lg aspect-video">
										<Image
											src={formSettings.ogImage}
											alt="OG Preview"
											className="object-cover"
											fill
											sizes="(max-width: 768px) 100vw, 400px"
											priority
										/>
									</div>
								</div>
							)}
							<div className="flex justify-start">
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept="image/*"
									className="hidden"
									disabled={isUploading}
								/>
								<Button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
									className="rounded-md px-6 py-2 shadow-sm text-sm"
								>
									{isUploading ? "Uploading..." : "Upload Image"}
								</Button>
							</div>
						</div>
					</div>
				</div>

				<SharingOptions formSettings={formSettings} updateSetting={updateSetting} />

				{/* <div className="space-y-4">
					<h3 className="font-medium">Social Links</h3>
					<p className="text-sm text-muted-foreground">
						Add links to your social pages
					</p>
					<div className="space-y-2">
						<Label htmlFor="twitter">Twitter/X Link</Label>
						<div className="relative">
							<Input
								id="twitter"
								value={formSettings.twitterLink}
								onChange={(e) =>
									updateSetting("twitterLink", e.target.value)
								}
								className="peer ps-[105px]"
								type="text"
							/>
							<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
								https://x.com/
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="facebook">Facebook Link</Label>
						<div className="relative">
							<Input
								id="facebook"
								value={formSettings.facebookLink}
								onChange={(e) =>
									updateSetting("facebookLink", e.target.value)
								}
								className="peer ps-[160px]"
								type="text"
							/>
							<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
								https://facebook.com/
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="instagram">Instagram Link</Label>
						<div className="relative">
							<Input
								id="instagram"
								value={formSettings.instagramLink}
								onChange={(e) =>
									updateSetting("instagramLink", e.target.value)
								}
								className="peer ps-[163px]"
								type="text"
							/>
							<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
								https://instagram.com/
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="linkedin">LinkedIn Link</Label>
						<div className="relative">
							<Input
								id="linkedin"
								value={formSettings.linkedinLink}
								onChange={(e) =>
									updateSetting("linkedinLink", e.target.value)
								}
								className="peer ps-[150px]"
								type="text"
							/>
							<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
								https://linkedin.com/
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reddit">Reddit Link</Label>
						<div className="relative">
							<Input
								id="reddit"
								value={formSettings.redditLink}
								onChange={(e) =>
									updateSetting("redditLink", e.target.value)
								}
								className="peer ps-[137px]"
								type="text"
							/>
							<span className="absolute inset-y-0 flex items-center justify-center text-sm pointer-events-none start-0 ps-3 text-muted-foreground peer-disabled:opacity-50">
								https://reddit.com/
							</span>
						</div>
					</div>
				</div> */}
			</div>
		</TabsContent>
	);
}
