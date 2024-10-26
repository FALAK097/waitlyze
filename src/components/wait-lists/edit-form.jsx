"use client";
import { removeImage } from "@/app/actions/waitLists";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
	const [testEmail, setTestEmail] = useState("");
	const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);

	const [formSettings, setFormSettings] = useState(() => {
		return {
			buttonColor: initialWaitList.buttonColor || "#8B5CF6",
			buttonBorder: initialWaitList.buttonBorder || "#7C3AED",
			buttonTextColor: initialWaitList.buttonTextColor || "#FFFFFF",
			bgColor: initialWaitList.bgColor || "#FFFFFF",
			borderWidth: initialWaitList.borderWidth || "0px",
			borderRadius: initialWaitList.borderRadius || "large",
			fontWeight: initialWaitList.fontWeight || "normal",
			logoSize: initialWaitList.logoSize || "1X",
			buttonText: initialWaitList.buttonText || "Join Waitlist",
			successMessage:
				initialWaitList.successMessage || "Success! You're on the waitlist 🎉",
			showLogo: initialWaitList.showLogo || true,
			showSocialProof: initialWaitList.showSocialProof || true,
			enableReferrals: initialWaitList.enableReferrals || false,
			inputColor: initialWaitList.inputColor || "#FFFFF",
			inputBorder: initialWaitList.inputBorder || "#E5E7EB",
			inputTextColor: initialWaitList.inputTextColor || "#000000",
			placeholderText: initialWaitList.placeholderText || "Enter your email",
			logoUrl: initialWaitList.logoUrl || "/images/logo.png",
			logoKey: initialWaitList.logoKey || "",
		};
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
		const logoKey = formSettings.logoKey;
		if (!logoKey) {
			toast.error("No logo key found to delete.");
			return;
		}

		try {
			// Remove Image from Uploads & Prisma
			const response = await removeImage(logoKey, initialWaitList.id);
			console.log("response", response);
			if (response.success) {
				toast.success("Logo deleted successfully.");
				setFormSettings((prev) => ({ ...prev, logoUrl: "", logoKey: "" }));
			} else {
				toast.error(response.message);
			}
		} catch (error) {
			console.error("Error deleting logo:", error);
			toast.error("An error occurred while deleting the logo.");
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
						<Button onClick={copyShareUrlToClipboard}>Share</Button>
					</div>
				</div>

				<div className="flex">
					{/* WaitList Form Preview */}
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
