"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";
import { UploadButton } from "../ui/upload-button";

const dummyUsers = [
	{
		id: 1,
		image: "https://i.pravatar.cc/500?u=a042581f4e290267041",
	},
	{
		id: 2,
		image: "https://i.pravatar.cc/500?u=a042581f4e29026704a",
	},
	{
		id: 3,
		image: "https://i.pravatar.cc/500?u=a042581f4e29026704b",
	},
	{
		id: 4,
		image: "https://i.pravatar.cc/500?u=a042581f4e29026704c",
	},
	{
		id: 5,
		image: "https://i.pravatar.cc/500?u=a042581f4e29026704d",
	},
];

export const SignUpForm = ({
	email,
	isLoading,
	waitList,
	onSubmit,
	setEmail,
	onDeleteLogo,
	onImageUploadSuccess,
}) => {
	return (
		<div
			className={`w-full max-w-md p-6 rounded-lg ${waitList.enableBgColor ? "shadow-md" : ""
				}`}
			style={{
				backgroundColor: waitList.enableBgColor
					? waitList.bgColor
					: "transparent",
			}}
		>
			<div className="space-y-4">
				{waitList.showBadge && (
					<div className="flex justify-center">
						<Badge
							className="px-4 py-1 mx-auto text-center rounded-full w-max"
							style={{
								backgroundColor: waitList.badgeColor,
								color: waitList.badgeTextColor,
							}}
						>
							{waitList.badgeText || "Sign Up to get early access"}
						</Badge>
					</div>
				)}

				{waitList.showLogo && waitList.logoUrl && (
					<div className="flex justify-center">
						<div className="relative">
							<Image
								alt={"WaitList logo"}
								src={waitList.logoUrl || "/images/logo.png"}
								width={64}
								height={64}
								className="transition duration-200 ease-in-out"
							/>
							{onImageUploadSuccess && (
								<UploadButton onSuccess={onImageUploadSuccess} />
							)}
						</div>
					</div>
				)}

				<form onSubmit={onSubmit} className="space-y-4">
					<Input
						value={email}
						required
						type="email"
						placeholder={waitList.placeholderText}
						disabled={isLoading}
						className="w-full"
						style={{
							backgroundColor: waitList.inputColor,
							borderColor: waitList.inputBorder,
							color: waitList.inputTextColor,
							borderWidth: waitList.borderWidth,
							borderRadius:
								waitList.borderRadius === "small"
									? "0.25rem"
									: waitList.borderRadius === "medium"
										? "0.5rem"
										: "0.75rem",
						}}
						onChange={(e) => {
							if (setEmail) {
								setEmail(e.target.value);
							}
						}}
					/>
					<Button
						type="submit"
						disabled={isLoading || !email}
						className="w-full"
						style={{
							backgroundColor: waitList.buttonColor,
							color: waitList.buttonTextColor,
							borderColor: waitList.buttonBorder,
							borderWidth: waitList.borderWidth,
							borderRadius:
								waitList.borderRadius === "small"
									? "0.25rem"
									: waitList.borderRadius === "medium"
										? "0.5rem"
										: "0.75rem",
							fontWeight: waitList.fontWeight,
						}}
					>
						{isLoading ? (
							<>
								<Spinner className="w-4 h-4 mr-2" />
								Please wait...
							</>
						) : (
							waitList.buttonText
						)}
					</Button>
					{waitList.showSocialProof && (
						<>
							<div className="flex items-center space-x-2 text-sm text-gray-500">
								<Zap className="w-4 h-4 text-purple-500" />
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
						</>
					)}
					{waitList.showBranding && (
						<span className="flex items-center justify-center text-center text-gray-500">
							Widget by&nbsp;
							<a
								href="https://waitlyze.falakgala.dev"
								className="font-medium text-[#FF6B4A]"
								target="_blank"
								rel="noopener noreferrer"
							>
								Waitlyze
							</a>
						</span>
					)}
				</form>
			</div>
		</div>
	);
};
