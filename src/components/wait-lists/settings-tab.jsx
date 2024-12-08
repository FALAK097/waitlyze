import { Button } from "@/components/ui/button";
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
import { UploadButton } from "@/utils/uploadthing";
import { X } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export function SettingsTab({ formSettings, updateSetting, applyPreset }) {
	return (
		<div className="w-full md:w-80 ml-0 px-4 md:ml-8 h-[calc(100vh-200px)] overflow-y-auto">
			<Tabs defaultValue="general" className="w-full">
				<TabsList>
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="input">Input</TabsTrigger>
					<TabsTrigger value="presets">Presets</TabsTrigger>
					<TabsTrigger value="social">Social</TabsTrigger>
				</TabsList>
				<TabsContent value="general" className="py-4 space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonColor">Button Color</Label>
						<ColorPicker
							id="buttonColor"
							value={formSettings.buttonColor}
							onChange={(color) => updateSetting("buttonColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonBorder">Button Border</Label>
						<ColorPicker
							id="buttonBorder"
							value={formSettings.buttonBorder}
							onChange={(color) => updateSetting("buttonBorder", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="buttonTextColor">Button Text Color</Label>
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
						<Label htmlFor="borderWidth">Border Width</Label>
						<Select
							value={formSettings.borderWidth}
							onValueChange={(value) => updateSetting("borderWidth", value)}
						>
							<SelectTrigger id="borderWidth">
								<SelectValue placeholder="Select border width" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0px">0px</SelectItem>
								<SelectItem value="1px">1px</SelectItem>
								<SelectItem value="2px">2px</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="borderRadius">Border Radius</Label>
						<Select
							value={formSettings.borderRadius}
							onValueChange={(value) => updateSetting("borderRadius", value)}
						>
							<SelectTrigger id="borderRadius">
								<SelectValue placeholder="Select border radius" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="small">Small</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="large">Large</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="fontWeight">Font Weight</Label>
						<Select
							value={formSettings.fontWeight}
							onValueChange={(value) => updateSetting("fontWeight", value)}
						>
							<SelectTrigger id="fontWeight">
								<SelectValue placeholder="Select font weight" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="bold">Bold</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="logoSize">Logo Size</Label>
						<Select
							value={formSettings.logoSize}
							onValueChange={(value) => updateSetting("logoSize", value)}
						>
							<SelectTrigger id="logoSize">
								<SelectValue placeholder="Select logo size" />
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
						<Label htmlFor="buttonText">Button Text</Label>
						<Input
							id="buttonText"
							value={formSettings.buttonText}
							onChange={(e) => updateSetting("buttonText", e.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor="successMessage">Success Message</Label>
						<Input
							id="successMessage"
							value={formSettings.successMessage}
							onChange={(e) => updateSetting("successMessage", e.target.value)}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showLogo"
							checked={formSettings.showLogo}
							onCheckedChange={(checked) => updateSetting("showLogo", checked)}
						/>
						<Label htmlFor="showLogo">Show Logo</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showSocialProof"
							checked={formSettings.showSocialProof}
							onCheckedChange={(checked) =>
								updateSetting("showSocialProof", checked)
							}
						/>
						<Label htmlFor="showSocialProof">Show Social Proof</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="showBadge"
							checked={formSettings.showBadge}
							onCheckedChange={(checked) => updateSetting("showBadge", checked)}
						/>
						<Label htmlFor="showBadge">Show Badge</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="enableReferrals"
							checked={formSettings.enableReferrals}
							onCheckedChange={(checked) =>
								updateSetting("enableReferrals", checked)
							}
						/>
						<Label htmlFor="enableReferrals">Enable Referrals</Label>
					</div>
				</TabsContent>
				<TabsContent value="input" className="py-4 space-y-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="inputColor">Input Color</Label>
						<ColorPicker
							id="inputColor"
							value={formSettings.inputColor}
							onChange={(color) => updateSetting("inputColor", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputBorder">Input Border</Label>
						<ColorPicker
							id="inputBorder"
							value={formSettings.inputBorder}
							onChange={(color) => updateSetting("inputBorder", color)}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="inputTextColor">Input Text Color</Label>
						<ColorPicker
							id="inputTextColor"
							value={formSettings.inputTextColor}
							onChange={(color) => updateSetting("inputTextColor", color)}
						/>
					</div>
					<div>
						<Label htmlFor="placeholderText">Placeholder Text</Label>
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
						style={{ backgroundColor: "#8B5CF6", color: "#FFFFFF" }}
						onClick={() => applyPreset("modern")}
					>
						Modern
					</Button>
					<Button
						className="w-full"
						style={{ backgroundColor: "#FF4136", color: "#FFFFFF" }}
						onClick={() => applyPreset("hot")}
					>
						Hot
					</Button>
					<Button
						className="w-full"
						style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
						onClick={() => applyPreset("minimal")}
					>
						Minimal
					</Button>
					<Button
						className="w-full"
						style={{
							backgroundColor: "#FFB6C1",
							color: "#000000",
							border: "2px solid #000000",
						}}
						onClick={() => applyPreset("funk")}
					>
						Funk
					</Button>
				</TabsContent>

				<TabsContent value="social" className="py-4 space-y-4">
					<div className="space-y-6">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">OG Title</Label>
								<p className="text-sm text-muted-foreground">
									This will be the title that shows up on social media when
									users share your waitlist.
								</p>
								<Input
									id="title"
									placeholder="Join the waitlist"
									value={formSettings.socialTitle}
									onChange={(e) => updateSetting("socialTitle", e.target.value)}
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
									value={formSettings.socialDescription}
									onChange={(e) =>
										updateSetting("socialDescription", e.target.value)
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
									{formSettings.socialImage && (
										<div className="space-y-2">
											<div className="flex justify-end">
												<Button
													variant="destructive"
													size="icon"
													className="w-6 h-6"
													onClick={() => updateSetting("socialImage", "")}
												>
													<X className="w-4 h-4" />
												</Button>
											</div>
											<div className="relative w-full overflow-hidden rounded-lg aspect-video">
												<Image
													src={formSettings.socialImage}
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
										<UploadButton
											appearance={{
												button:
													"ut-ready:bg-primary ut-button:ut-readying:bg-primary ut-uploading:cursor-not-allowed rounded-md px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm",
											}}
											endpoint="imageUploader"
											onClientUploadComplete={(res) => {
												if (res?.[0]?.url) {
													updateSetting("socialImage", res[0].url);
													toast.success("Image uploaded successfully");
												}
											}}
											onUploadError={(error) => {
												toast.error(`ERROR! ${error.message}`);
											}}
										/>
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

						<div className="space-y-4">
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
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
