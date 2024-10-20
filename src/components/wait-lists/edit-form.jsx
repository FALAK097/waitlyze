"use client";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { removeUpload } from "../../app/actions/removeUpload";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
	const [testEmail, setTestEmail] = useState("");
	const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
	const [onDeleteLogo, setOnDeleteLogo] = useState(false);

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
			logoKey: initialWaitList.logoKey || "",
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

	const handleDeleteLogo = async () => {
		const logoKey = formSettings.logoKey; // Use the logoKey from formSettings
		if (!logoKey) {
			toast.error("No logo key found to delete.");
			return;
		}

		const res = await removeUpload(logoKey);
		if (res.success) {
			toast.success("Logo deleted successfully");
			// Optionally reset the logoUrl and logoKey if necessary
			updateSetting("logoUrl", ""); // Reset logoUrl in form settings
			updateSetting("logoKey", ""); // Reset logoKey in form settings
		} else {
			toast.error("Failed to delete logo");
		}
		console.log("Delete logo");
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
							email={testEmail}
							isLoading={isTestEmailLoading}
							setEmail={setTestEmail}
							waitList={formSettings}
							onDeleteLogo={handleDeleteLogo}
							onSubmit={async (e) => {
								e.preventDefault();
								setIsTestEmailLoading(true);
								await new Promise((resolve) => setTimeout(resolve, 1500));
								toast.success(formSettings.successMessage, {
									position: "top-center",
								});
								setIsTestEmailLoading(false);
							}}
						/>
					</div>

					{/* Settings Tabs */}
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
