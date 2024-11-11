"use client";
import { removeImage } from "@/app/actions/waitLists";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Save } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { CodeBlock } from "../ui/code-block";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import { SettingsTab } from "./settings-tab";
import { SignUpForm } from "./sign-up-form";

const EmbedModal = ({ waitList }) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Embed</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[625px]">
				<DialogHeader>
					<DialogTitle>Instructions</DialogTitle>
					<DialogDescription>
						Follow the bellow instructions to embed the form on your website.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div>
						<p className="col-span-3 my-2 mb-4">
							{/* biome-ignore lint/style/noUnusedTemplateLiteral: <explanation> */}
							{`Step 1. Copy and paste the below code in the <head> section`}
						</p>
						<CodeBlock
							language="html"
							code={`<!-- HypeItUp Widget JS -->\n<script src="${window.location.origin}/js/embed.js" defer></script>`}
						/>
					</div>
					<div>
						<p className="col-span-3 my-2 mb-4">
							Step 2. Paste the following code anywhere on your page where you
							want to display the form
						</p>
						<CodeBlock
							language="html"
							code={`<!-- HypeItUp Widget UI -->\n<div class="hypeitup-widget" data-key-id="${waitList.id}" data-height="380px"></div>`}
						/>
					</div>
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button onClick={() => {}}>Done</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export const WaitlistGenerator = ({ initialWaitList, saveWaitList }) => {
	const [testEmail, setTestEmail] = useState("");
	const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);

	const [formSettings, setFormSettings] = useState(() => {
		return {
			buttonColor: initialWaitList.buttonColor || "#8B5CF6",
			buttonBorder: initialWaitList.buttonBorder || "#7C3AED",
			buttonTextColor: initialWaitList.buttonTextColor || "#FFFFFF",
			mainBgColor: initialWaitList.mainBgColor || "#FFFFFF",
			bgColor: initialWaitList.bgColor || "#FFFFFF",
			borderWidth: initialWaitList.borderWidth || "0px",
			borderRadius: initialWaitList.borderRadius || "large",
			fontWeight: initialWaitList.fontWeight || "normal",
			logoSize: initialWaitList.logoSize || "1X",
			buttonText: initialWaitList.buttonText || "Join waitlist",
			successMessage:
				initialWaitList.successMessage || "Success! You're on the waitlist 🎉",
			showLogo: initialWaitList.showLogo || true,
			showSocialProof: initialWaitList.showSocialProof || true,
			showBadge: initialWaitList.showBadge || true,
			badgeText:
				initialWaitList.badgeText || "Sign Up and get 50% off on launch",
			badgeColor: initialWaitList.badgeColor || "#8B5CF6",
			badgeTextColor: initialWaitList.badgeTextColor || "#FFFFFF",
			enableReferrals: initialWaitList.enableReferrals || false,
			inputColor: initialWaitList.inputColor || "#FFFFFF",
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
			mainBgColor: "#FFFFFF",
			bgColor: "#FFFFFF",
			borderWidth: "0px",
			borderRadius: "medium",
			inputColor: "#F3F4F6",
			inputBorder: "#E5E7EB",
			inputTextColor: "#000000",
			badgeColor: "#8B5CF6",
			badgeTextColor: "#FFFFFF",
		},
		hot: {
			buttonColor: "#FF4136",
			buttonBorder: "#E7040F",
			buttonTextColor: "#FFFFFF",
			mainBgColor: "#FFFFFF",
			bgColor: "#FFDFDF",
			borderWidth: "2px",
			borderRadius: "large",
			inputColor: "#FFFFFF",
			inputBorder: "#FF4136",
			inputTextColor: "#FF4136",
			badgeColor: "#FF4136",
			badgeTextColor: "#FFFFFF",
		},
		minimal: {
			buttonColor: "#000000",
			buttonBorder: "#000000",
			buttonTextColor: "#FFFFFF",
			mainBgColor: "#FFFFFF",
			bgColor: "#FFFFFF",
			borderWidth: "1px",
			borderRadius: "small",
			inputColor: "#FFFFFF",
			inputBorder: "#000000",
			inputTextColor: "#000000",
			badgeColor: "#000000",
			badgeTextColor: "#FFFFFF",
		},
		funk: {
			buttonColor: "#000000",
			buttonBorder: "#000000",
			buttonTextColor: "#FFB6C1",
			mainBgColor: "#FFFFFF",
			bgColor: "#FFB6C1",
			borderWidth: "4px",
			borderRadius: "none",
			inputColor: "#FFFFFF",
			inputBorder: "#000000",
			inputTextColor: "#000000",
			badgeColor: "#FF69B4",
			badgeTextColor: "#000000",
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

	const onImageUploadSuccess = (files) => {
		updateSetting("logoUrl", files[0].url);
		updateSetting("logoKey", files[0].key);
	};

	return (
		<div className="flex-1 overflow-auto">
			<div className="p-8">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold">
						Edit {initialWaitList.name} Wait List
					</h2>
					<div className="flex space-x-2">
						<TooltipProvider>
							<Tooltip delayDuration={100}>
								<TooltipTrigger asChild>
									<Button onClick={handleSave} variant="outline" size="icon">
										<Save className="w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">Save Wait List</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<EmbedModal waitList={initialWaitList} />

						<Dialog>
							<TooltipProvider>
								<Tooltip delayDuration={100}>
									<TooltipTrigger asChild>
										<DialogTrigger asChild>
											<Button>Share</Button>
										</DialogTrigger>
									</TooltipTrigger>
									<TooltipContent side="bottom">Share Wait List</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Share link</DialogTitle>
									<DialogDescription>
										Copy the link below to share your waitlist form.
									</DialogDescription>
								</DialogHeader>
								<div className="flex items-center space-x-2">
									<div className="grid flex-1 gap-2">
										<Label htmlFor="link" className="sr-only">
											Link
										</Label>
										<Input
											id="link"
											defaultValue={`${window.location.origin}/forms/${initialWaitList.id}`}
											readOnly
										/>
									</div>
									<Button
										onClick={copyShareUrlToClipboard}
										type="submit"
										size="sm"
										className="px-3"
									>
										<span className="sr-only">Copy</span>
										<Copy className="w-4 h-4" />
									</Button>
								</div>
								<DialogFooter className="sm:justify-start">
									<DialogClose asChild>
										<Button type="button" variant="secondary">
											Close
										</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="flex flex-col gap-4 md:flex-row md:gap-0">
					{/* WaitList Form Preview */}
					<div
						style={{ backgroundColor: formSettings.mainBgColor }}
						className="flex items-center justify-center flex-1"
					>
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
							onImageUploadSuccess={onImageUploadSuccess}
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
