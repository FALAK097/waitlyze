"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Spinner } from "../ui/spinner";

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

export const SignUpForm = ({
	email,
	isLoading,
	waitList,
	onSubmit,
	setEmail,
	onDeleteLogo,
}) => {
	return (
		<div
			className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
			style={{ backgroundColor: waitList.bgColor }}
		>
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="space-y-4">
					{waitList.showLogo && waitList.logoUrl && (
						<div className="flex justify-center relative">
							<Image
								alt={"WaitList logo"}
								src={waitList.logoUrl || "/images/logo.png"}
								width={64}
								height={64}
								className="transition duration-200 ease-in-out"
							/>
						</div>
					)}

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
								<Spinner className="h-4 w-4 mr-2" />
								Please wait...
							</>
						) : (
							waitList.buttonText
						)}
					</Button>
					{waitList.showSocialProof && (
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
			</form>
		</div>
	);
};
