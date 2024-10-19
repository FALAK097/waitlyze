"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { SettingsTab } from "./settings-tab";

const dummyUsers = [
	{
		id: 1,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 2,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 3,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 4,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 5,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 6,
		image: "https://picsum.photos/500/500",
	},
	{
		id: 7,
		image: "https://picsum.photos/500/500",
	},
];

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
					</div>
				</div>

				<div className="flex">
					{/* Waitlist Form Preview */}
					<div className="flex-1 flex items-center justify-center">
						<div
							className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
							style={{ backgroundColor: formSettings.bgColor }}
						>
							<div className="space-y-4">
								{formSettings.showLogo && formSettings.logoUrl && (
									<div className="flex justify-center">
										<Image
											alt={`${initialWaitList.name} logo`}
											src={formSettings.logoUrl || "/images/logo.png"}
											width={64}
											height={64}
										/>
									</div>
								)}
								<Input
									type="email"
									placeholder={formSettings.placeholderText}
									className="w-full"
									style={{
										backgroundColor: formSettings.inputColor,
										borderColor: formSettings.inputBorder,
										color: formSettings.inputTextColor,
										borderWidth: formSettings.borderWidth,
										borderRadius:
											formSettings.borderRadius === "small"
												? "0.25rem"
												: formSettings.borderRadius === "medium"
													? "0.5rem"
													: "0.75rem",
									}}
								/>
								<Button
									className="w-full"
									style={{
										backgroundColor: formSettings.buttonColor,
										color: formSettings.buttonTextColor,
										borderColor: formSettings.buttonBorder,
										borderWidth: formSettings.borderWidth,
										borderRadius:
											formSettings.borderRadius === "small"
												? "0.25rem"
												: formSettings.borderRadius === "medium"
													? "0.5rem"
													: "0.75rem",
										fontWeight: formSettings.fontWeight,
									}}
								>
									{formSettings.buttonText}
								</Button>
								{formSettings.showSocialProof && (
									<div className="flex items-center space-x-2 text-sm text-gray-500">
										<Zap className="h-4 w-4 text-purple-500" />
										<div className="flex -space-x-1 overflow-hidden">
											{dummyUsers.map((_, i) => {
												return (
													<Avatar
														key={`user-${i}-${_.id}-${_.image}`}
														className="inline-block border-2 border-white rounded-full"
													>
														<AvatarImage src={_.image} />
														<AvatarFallback>U{i + 1}</AvatarFallback>
													</Avatar>
												);
											})}
										</div>
										<span>Be the first to join</span>
									</div>
								)}
							</div>
						</div>
					</div>
					{/* Settings Tab */}
					<SettingsTab
						formSettings={formSettings}
						updateSetting={updateSetting}
						applyPreset={applyPreset}
					/>
				</div>
			</div>
		</div>
	);
};
