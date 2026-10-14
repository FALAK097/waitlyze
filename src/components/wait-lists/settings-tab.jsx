"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import styles from "./legacy-editor.module.css";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useR2Upload } from "@/utils/r2-upload";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";

export function SettingsTab({ formSettings, updateSetting, applyPreset }) {
	const fileInputRef = useRef(null);
	const { startUpload, isUploading } = useR2Upload("imageUploader", {
		onClientUploadComplete: (res) => {
			if (res?.[0]?.url) {
				updateSetting("ogImage", res[0].url);
				toast.success("Image uploaded successfully");
			}
		},
		onUploadError: (error) => {
			toast.error(error.message || "Could not upload this image. Try another PNG, JPEG or WebP.");
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
		<section className={styles.controls} aria-label="Form settings">
			<Tabs defaultValue="general" className="w-full">
				<TabsList className={styles.tabList} aria-label="Form settings sections">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="input">Input</TabsTrigger>
					<TabsTrigger value="presets">Presets</TabsTrigger>
					<TabsTrigger value="social">Social</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="py-4 space-y-4">
					<div>
						<Label htmlFor="waitlistName">Waitlist name</Label>
						<Input
							id="waitlistName"
							value={formSettings.name || ""}
							maxLength={120}
							onChange={(e) => updateSetting("name", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="waitlistSlug">Page address</Label>
						<div className="flex items-center gap-1">
							<span aria-hidden="true" className="text-sm text-muted-foreground">/w/</span>
							<Input
								id="waitlistSlug"
								value={formSettings.publicSlug || ""}
								minLength={3}
								maxLength={64}
								pattern="[a-z0-9]+(-[a-z0-9]+)*"
								autoCapitalize="none"
								spellCheck={false}
								autoComplete="off"
								onChange={(e) => updateSetting("publicSlug", e.target.value)}
							/>
						</div>
					</div>
					<div>
						<Label htmlFor="waitlistDescription">Description <span className="font-normal text-muted-foreground">Optional</span></Label>
						<Input
							id="waitlistDescription"
							value={formSettings.description || ""}
							maxLength={600}
							onChange={(e) => updateSetting("description", e.target.value)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonColor">Button color</Label>
						<ColorPicker
							id="buttonColor"
							value={formSettings.buttonColor}
							onChange={(color) => updateSetting("buttonColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonBorder">Button border</Label>
						<ColorPicker
							id="buttonBorder"
							value={formSettings.buttonBorder}
							onChange={(color) => updateSetting("buttonBorder", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonTextColor">Button text color</Label>
						<ColorPicker
							id="buttonTextColor"
							value={formSettings.buttonTextColor}
							onChange={(color) => updateSetting("buttonTextColor", color)}
						/>
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enableMainBgColor">Enable Background Color</Label>
							<Switch
								id="enableMainBgColor"
								checked={formSettings.enableMainBgColor}
								onCheckedChange={(checked) =>
									updateSetting("enableMainBgColor", checked)
								}
							/>
						</div>

						{formSettings.enableMainBgColor && (
							<div className="flex items-center justify-between">
								<Label htmlFor="mainBgColor">Background Color</Label>
								<ColorPicker
									id="mainBgColor"
									value={formSettings.mainBgColor}
									onChange={(color) => updateSetting("mainBgColor", color)}
								/>
							</div>
						)}
					</div>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="enableBgColor">Enable Widget BG Color</Label>
							<Switch
								id="enableBgColor"
								checked={formSettings.enableBgColor}
								onCheckedChange={(checked) =>
									updateSetting("enableBgColor", checked)
								}
							/>
						</div>

						{formSettings.enableBgColor && (
							<div className="flex items-center justify-between">
								<Label htmlFor="bgColor">Widget BG Color</Label>
								<ColorPicker
									id="bgColor"
									value={formSettings.bgColor}
									onChange={(color) => updateSetting("bgColor", color)}
								/>
							</div>
						)}
					</div>
					<div>
						<Label htmlFor="borderWidth">Border width</Label>
						<Select
							value={formSettings.borderWidth}
							onValueChange={(value) => updateSetting("borderWidth", value)}
						>
							<SelectTrigger id="borderWidth">
								<SelectValue>Select border width</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0px">0px</SelectItem>
								<SelectItem value="1px">1px</SelectItem>
								<SelectItem value="2px">2px</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="borderRadius">Border radius</Label>
						<Select
							value={formSettings.borderRadius}
							onValueChange={(value) => updateSetting("borderRadius", value)}
						>
							<SelectTrigger id="borderRadius">
								<SelectValue>Select border radius</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="small">Small</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="large">Large</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="fontWeight">Font weight</Label>
						<Select
							value={formSettings.fontWeight}
							onValueChange={(value) => updateSetting("fontWeight", value)}
						>
							<SelectTrigger id="fontWeight">
								<SelectValue>Select font weight</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="bold">Bold</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="logoSize">Logo size</Label>
						<Select
							value={formSettings.logoSize}
							onValueChange={(value) => updateSetting("logoSize", value)}
						>
							<SelectTrigger id="logoSize">
								<SelectValue>Select logo size</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1X">1X</SelectItem>
								<SelectItem value="2X">2X</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{formSettings.showBadge && (
						<>
							<div>
								<Label htmlFor="badgeText">Badge Text</Label>
								<Input
									id="badgeText"
									value={formSettings.badgeText}
									onChange={(e) => updateSetting("badgeText", e.target.value)}
								/>
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="badgeColor">Badge Color</Label>
								<ColorPicker
									id="badgeColor"
									value={formSettings.badgeColor}
									onChange={(color) => updateSetting("badgeColor", color)}
								/>
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="badgeTextColor">Badge Text Color</Label>
								<ColorPicker
									id="badgeTextColor"
									value={formSettings.badgeTextColor}
									onChange={(color) => updateSetting("badgeTextColor", color)}
								/>
							</div>
						</>
					)}
					<div>
						<Label htmlFor="buttonText">Button text</Label>
						<Input
							id="buttonText"
							value={formSettings.buttonText}
							onChange={(e) => updateSetting("buttonText", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="successMessage">Success message</Label>
						<Input
							id="successMessage"
							value={formSettings.successMessage}
							onChange={(e) => updateSetting("successMessage", e.target.value)}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="sendEmailsToSubscribers"
							checked={formSettings.sendEmailsToSubscribers}
							onCheckedChange={(checked) => updateSetting("sendEmailsToSubscribers", checked)}
						/>
						<Label htmlFor="sendEmailsToSubscribers">Send Email to Subscribers</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showLogo"
							checked={formSettings.showLogo}
							onCheckedChange={(checked) => updateSetting("showLogo", checked)}
						/>
						<Label htmlFor="showLogo">Show logo</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showSocialProof"
							checked={formSettings.showSocialProof}
							onCheckedChange={(checked) =>
								updateSetting("showSocialProof", checked)
							}
						/>
						<Label htmlFor="showSocialProof">Show social proof</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showBadge"
							checked={formSettings.showBadge}
							onCheckedChange={(checked) => updateSetting("showBadge", checked)}
						/>
						<Label htmlFor="showBadge">Show badge</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showReferrals"
							checked={formSettings.showReferrals}
							onCheckedChange={(checked) =>
								updateSetting("showReferrals", checked)
							}
						/>
						<Label htmlFor="showReferrals">Show referrals</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showBranding"
							checked={formSettings.showBranding}
							onCheckedChange={(checked) =>
								updateSetting("showBranding", checked)
							}
						/>
						<Label htmlFor="showBranding">Show Waitlyze branding</Label>
					</div>
				</TabsContent>

				<TabsContent value="input" className="py-4 space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="inputColor">Input color</Label>
						<ColorPicker
							id="inputColor"
							value={formSettings.inputColor}
							onChange={(color) => updateSetting("inputColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputBorder">Input border</Label>
						<ColorPicker
							id="inputBorder"
							value={formSettings.inputBorder}
							onChange={(color) => updateSetting("inputBorder", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputTextColor">Input text color</Label>
						<ColorPicker
							id="inputTextColor"
							value={formSettings.inputTextColor}
							onChange={(color) => updateSetting("inputTextColor", color)}
						/>
					</div>
					<div>
						<Label htmlFor="placeholderText">Placeholder text</Label>
						<Input
							id="placeholderText"
							value={formSettings.placeholderText}
							onChange={(e) => updateSetting("placeholderText", e.target.value)}
						/>
					</div>
				</TabsContent>
				<TabsContent value="presets" className="py-4 space-y-4">
					<Button
						className="w-full"
						variant="outline"
						onClick={() => applyPreset("modern")}
					>
						Modern
					</Button>
					<Button
						className="w-full"
						variant="outline"
						onClick={() => applyPreset("hot")}
					>
						Hot
					</Button>
					<Button
						className="w-full"
						variant="outline"
						onClick={() => applyPreset("minimal")}
					>
						Minimal
					</Button>
					<Button
						className="w-full"
						variant="outline"
						onClick={() => applyPreset("funk")}
					>
						Funk
					</Button>
				</TabsContent>

				<TabsContent value="social" className="py-4 space-y-4">
					<div className="space-y-6">
						<div className="space-y-4">
							<h3 className="font-medium">Open Graph Settings</h3>
							<p className="text-sm text-muted-foreground">
								These settings control how your waitlist appears when shared on
								social media.
							</p>
							<div className="space-y-2">
								<Label htmlFor="title">Sharing title</Label>
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
								<Label htmlFor="description">Sharing description</Label>
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
								<Label htmlFor="image">Sharing image</Label>
								<p className="text-sm text-muted-foreground">
									This will be the image that shows up on social media when
									users share your waitlist.
								</p>
								<div className="grid w-full max-w-sm items-start gap-1.5">
									{formSettings.ogImage && (
										<div className="space-y-2">
											<div className="flex justify-end">
												<Button
													variant="ghost"
													size="icon"
													aria-label="Remove sharing image"
													onClick={() => updateSetting("ogImage", "")}
												>
													<HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" aria-hidden="true" />
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
											id="image"
											aria-label="Upload sharing image"
											ref={fileInputRef}
											onChange={handleFileChange}
											accept="image/png,image/jpeg,image/webp"
											className="hidden"
											disabled={isUploading}
										/>
										<Button
											type="button"
											onClick={() => fileInputRef.current?.click()}
											disabled={isUploading}
											className="rounded-md px-6 py-2 shadow-sm text-sm"
										>
											{isUploading ? "Uploading…" : "Upload image"}
										</Button>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="font-medium">Sharing Options</h3>
							<p className="text-sm text-muted-foreground">
								Pick which links we show on the post-signup section for users to
								share their referral links on.
							</p>
							<div className="space-y-4">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="twitter-share"
										checked={formSettings.shareOnTwitter}
										onCheckedChange={(checked) =>
											updateSetting("shareOnTwitter", checked)
										}
									/>
									<Label htmlFor="twitter-share">Twitter/X</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="whatsapp-share"
										checked={formSettings.shareOnWhatsapp}
										onCheckedChange={(checked) =>
											updateSetting("shareOnWhatsapp", checked)
										}
									/>
									<Label htmlFor="whatsapp-share">WhatsApp</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="instagram-share"
										checked={formSettings.shareOnInstagram}
										onCheckedChange={(checked) =>
											updateSetting("shareOnInstagram", checked)
										}
									/>
									<Label htmlFor="instagram-share">Instagram</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="facebook-share"
										checked={formSettings.shareOnFacebook}
										onCheckedChange={(checked) =>
											updateSetting("shareOnFacebook", checked)
										}
									/>
									<Label htmlFor="facebook-share">Facebook</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="linkedin-share"
										checked={formSettings.shareOnLinkedin}
										onCheckedChange={(checked) =>
											updateSetting("shareOnLinkedin", checked)
										}
									/>
									<Label htmlFor="linkedin-share">LinkedIn</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="email-share"
										checked={formSettings.shareOnEmail}
										onCheckedChange={(checked) =>
											updateSetting("shareOnEmail", checked)
										}
									/>
									<Label htmlFor="email-share">Email</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="reddit-share"
										checked={formSettings.shareOnReddit}
										onCheckedChange={(checked) =>
											updateSetting("shareOnReddit", checked)
										}
									/>
									<Label htmlFor="reddit-share">Reddit</Label>
								</div>
							</div>
						</div>

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
			</Tabs>
		</section>
	);
}
