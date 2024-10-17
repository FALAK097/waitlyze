"use client";

import { Button } from "@/components/ui/button";
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
import { Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ColorPicker } from "../ui/color-picker";
import UploadImage from "../upload-image";
import { SignUpForm } from "./sign-up-form";

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
	const [formSettings, setFormSettings] = useState(() => {
		const defaultSettings = {
			buttonColor: "#8B5CF6",
			buttonBorder: "#7C3AED",
			buttonTextColor: "#FFFFFF",
			bgColor: "#FFFFFF",
			borderWidth: "0px",
			borderRadius: "large",
			fontWeight: "normal",
			logoSize: "1X",
			buttonText: "Join the waitlist",
			successMessage: "Success! You're on the waitlist 🎉",
			showLogo: true,
			showSocialProof: true,
			enableReferrals: false,
			inputColor: "#FFFFFF",
			inputBorder: "#E5E7EB",
			inputTextColor: "#000000",
			placeholderText: "Email",
			logoUrl: initialWaitList.logoUrl || "/images/logo.png",
		};

		if (initialWaitList?.buttonTextColor) {
			return {
				...defaultSettings,
				...initialWaitList,
				showLogo:
					initialWaitList.showLogo !== undefined
						? initialWaitList.showLogo
						: defaultSettings.showLogo,
				showSocialProof:
					initialWaitList.showSocialProof !== undefined
						? initialWaitList.showSocialProof
						: defaultSettings.showSocialProof,
			};
		}

		return defaultSettings;
	});

	const updateSetting = (key, value) => {
		setFormSettings((prev) => ({ ...prev, [key]: value }));
	};

	const presets = {
		modern: {
			buttonColor: "#8B5CF6",
			buttonBorder: "#7C3AED",
			buttonTextColor: "#FFFFFF",
			bgColor: "#FFFFFF",
			borderWidth: "0px",
			borderRadius: "medium",
			inputColor: "#F3F4F6",
			inputBorder: "#E5E7EB",
			inputTextColor: "#000000",
		},
		hot: {
			buttonColor: "#FF4136",
			buttonBorder: "#E7040F",
			buttonTextColor: "#FFFFFF",
			bgColor: "#FFDFDF",
			borderWidth: "2px",
			borderRadius: "large",
			inputColor: "#FFFFFF",
			inputBorder: "#FF4136",
			inputTextColor: "#FF4136",
		},
		minimal: {
			buttonColor: "#000000",
			buttonBorder: "#000000",
			buttonTextColor: "#FFFFFF",
			bgColor: "#FFFFFF",
			borderWidth: "1px",
			borderRadius: "small",
			inputColor: "#FFFFFF",
			inputBorder: "#000000",
			inputTextColor: "#000000",
		},
		funk: {
			buttonColor: "#000000",
			buttonBorder: "#000000",
			buttonTextColor: "#FFB6C1",
			bgColor: "#FFB6C1",
			borderWidth: "4px",
			borderRadius: "none",
			inputColor: "#FFFFFF",
			inputBorder: "#000000",
			inputTextColor: "#000000",
		},
	};

	const applyPreset = (preset) => {
		setFormSettings((prev) => ({ ...prev, ...presets[preset] }));
	};

	const handleSave = async () => {
		const response = await saveWaitList(initialWaitList.id, formSettings);
		if (response.success) {
			toast.success(response.message);
		}
	};

	const copyShareUrlToClipboard = () => {
		const url = `${window.location.origin}/forms/${initialWaitList.id}`;
		navigator.clipboard.writeText(url);
		toast.success("Copied to clipboard");
	};

	return (
		<div className="flex-1 overflow-auto">
			<div className="p-8">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-semibold">
						Edit {initialWaitList.name} Wait List
					</h2>
					<div className="flex space-x-2">
						<Button onClick={handleSave} variant="outline" size="icon">
							<Save className="h-4 w-4" />
						</Button>
						<Button>Get Embed Code</Button>
						<Button onClick={copyShareUrlToClipboard}>Share</Button>
					</div>
				</div>

				<div className="flex">
					{/* Waitlist Form Preview */}
					<div className="flex-1 flex items-center justify-center">
						<SignUpForm
							waitList={formSettings}
							onSubmit={(e) => {
								e.preventDefault();
								toast.success(formSettings.successMessage, {
									position: "top-center",
								});
							}}
						/>
					</div>

					{/* Settings Tabs */}
					<div className="w-80 ml-8">
						<Tabs defaultValue="general" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="general">General</TabsTrigger>
								<TabsTrigger value="input">Input</TabsTrigger>
								<TabsTrigger value="presets">Presets</TabsTrigger>
							</TabsList>
							<TabsContent value="general" className="space-y-4">
								<div>
									<Label htmlFor="logoUrl">Logo</Label>
									<UploadImage
										onSuccess={(files) => {
											updateSetting("logoUrl", files[0].url);
											toast.success("Logo uploaded successfully");
										}}
									/>
								</div>
								<div>
									<Label htmlFor="buttonColor">Button Color</Label>
									<ColorPicker
										value={formSettings.buttonColor}
										onChange={(color) => updateSetting("buttonColor", color)}
									/>
								</div>
								<div>
									<Label htmlFor="buttonBorder">Button Border</Label>
									<Input
										id="buttonBorder"
										type="color"
										value={formSettings.buttonBorder}
										onChange={(e) =>
											updateSetting("buttonBorder", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="buttonTextColor">Button Text Color</Label>
									<Input
										id="buttonTextColor"
										type="color"
										value={formSettings.buttonTextColor}
										onChange={(e) =>
											updateSetting("buttonTextColor", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="bgColor">BG Color</Label>
									<Input
										id="bgColor"
										type="color"
										value={formSettings.bgColor}
										onChange={(e) => updateSetting("bgColor", e.target.value)}
									/>
								</div>
								<div>
									<Label htmlFor="borderWidth">Border Width</Label>
									<Select
										value={formSettings.borderWidth}
										onValueChange={(value) =>
											updateSetting("borderWidth", value)
										}
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
										onValueChange={(value) =>
											updateSetting("borderRadius", value)
										}
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
										onValueChange={(value) =>
											updateSetting("fontWeight", value)
										}
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
								<div>
									<Label htmlFor="buttonText">Button Text</Label>
									<Input
										id="buttonText"
										value={formSettings.buttonText}
										onChange={(e) =>
											updateSetting("buttonText", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="successMessage">Success Message</Label>
									<Input
										id="successMessage"
										value={formSettings.successMessage}
										onChange={(e) =>
											updateSetting("successMessage", e.target.value)
										}
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Switch
										id="showLogo"
										checked={formSettings.showLogo}
										onCheckedChange={(checked) =>
											updateSetting("showLogo", checked)
										}
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
										id="enableReferrals"
										checked={formSettings.enableReferrals}
										onCheckedChange={(checked) =>
											updateSetting("enableReferrals", checked)
										}
									/>
									<Label htmlFor="enableReferrals">Enable Referrals</Label>
								</div>
							</TabsContent>
							<TabsContent value="input" className="space-y-4">
								<div>
									<Label htmlFor="inputColor">Input Color</Label>
									<Input
										id="inputColor"
										type="color"
										value={formSettings.inputColor}
										onChange={(e) =>
											updateSetting("inputColor", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="inputBorder">Input Border</Label>
									<Input
										id="inputBorder"
										type="color"
										value={formSettings.inputBorder}
										onChange={(e) =>
											updateSetting("inputBorder", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="inputTextColor">Input Text Color</Label>
									<Input
										id="inputTextColor"
										type="color"
										value={formSettings.inputTextColor}
										onChange={(e) =>
											updateSetting("inputTextColor", e.target.value)
										}
									/>
								</div>
								<div>
									<Label htmlFor="placeholderText">Placeholder Text</Label>
									<Input
										id="placeholderText"
										value={formSettings.placeholderText}
										onChange={(e) =>
											updateSetting("placeholderText", e.target.value)
										}
									/>
								</div>
							</TabsContent>
							<TabsContent value="presets" className="space-y-4">
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
						</Tabs>
					</div>
				</div>
			</div>
		</div>
	);
};
