"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	EnvelopeClosedIcon,
	InstagramLogoIcon,
	LinkedInLogoIcon,
	TwitterLogoIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const ReferralPreview = ({
	signUp,
	waitList,
	getTotalSignUpsOnWaitList,
	initialSignUpsCount,
}) => {
	const referralLink = `${window.location.origin}/forms/${waitList.id}?r=${signUp.uniqueUserId}`;
	const [totalSignUps, setTotalSignUps] = useState(initialSignUpsCount || 0);
	const shareText = `I'm on the waitlist for ${
		waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
	}! Join me and move up in line: ${referralLink}`;

	const shareOnFacebook = () => {
		const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
			referralLink,
		)}&quote=${encodeURIComponent(shareText)}`;
		window.open(facebookUrl, "_blank");
	};

	const shareOnLinkedin = () => {
		const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
			referralLink,
		)}`;
		window.open(linkedinUrl, "_blank");
	};

	const shareOnEmail = () => {
		const subject = `Join me on the waitlist for ${waitList.name}`;
		const emailUrl = `mailto:?subject=${encodeURIComponent(
			subject,
		)}&body=${encodeURIComponent(shareText)}`;
		window.open(emailUrl);
	};

	const shareOnReddit = () => {
		const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
			referralLink,
		)}&title=${encodeURIComponent(shareText)}`;
		window.open(redditUrl, "_blank");
	};

	const shareOnTwitter = () => {
		const text = `I'm on the waitlist for ${
			waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
		}! Join me and move up in line: ${referralLink}`;
		const xUrl = `https://x.com/intent/post?text=${text}`;
		window.open(xUrl, "_blank");
	};

	const shareOnWhatsApp = () => {
		const text = `I'm on the waitlist for ${
			waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
		}! Join me and move up in line: ${referralLink}`;
		const whatsAppUrl = `https://wa.me/?text=${text}`;
		window.open(whatsAppUrl, "_blank");
	};

	const shareOnInstagram = () => {
		const text = `I'm on the waitlist for ${
			waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
		}! Join me and move up in line: ${referralLink}`;
		// Since Instagram doesn't have a direct sharing API, we'll copy the text to clipboard
		navigator.clipboard.writeText(text);
		toast.success("Text copied! Share it on your Instagram story or post");
	};

	const container = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	const shareButtons = [
		{
			name: "Twitter",
			show: waitList.shareOnTwitter,
			onClick: shareOnTwitter,
			icon: <TwitterLogoIcon className="w-5 h-5" />,
			className: "bg-[#1DA1F2] hover:bg-[#1a8cd8] shadow-lg",
		},
		{
			name: "WhatsApp",
			show: waitList.shareOnWhatsapp,
			onClick: shareOnWhatsApp,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0px"
					y="0px"
					width="48"
					height="48"
					viewBox="0 0 48 48"
					aria-label="WhatsApp Logo"
					role="img"
				>
					<path
						fill="#fff"
						d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"
					/>
					<path
						fill="#fff"
						d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"
					/>
					<path
						fill="#cfd8dc"
						d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"
					/>
					<path
						fill="#40c351"
						d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"
					/>
					<path
						fill="#fff"
						fill-rule="evenodd"
						d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z"
						clip-rule="evenodd"
					/>
				</svg>
			),
			className: "bg-[#25D366] hover:bg-[#20bd5a] shadow-lg",
		},
		{
			name: "Instagram",
			show: waitList.shareOnInstagram,
			onClick: shareOnInstagram,
			icon: <InstagramLogoIcon className="w-5 h-5" />,
			className:
				"bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 shadow-lg",
		},
		{
			name: "Facebook",
			show: waitList.shareOnFacebook,
			onClick: shareOnFacebook,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0px"
					y="0px"
					width="48"
					height="48"
					viewBox="0 0 48 48"
					aria-label="Facebook Share Icon"
					role="img"
				>
					<path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z" />
					<path
						fill="#fff"
						d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"
					/>
				</svg>
			),
			className: "bg-[#1877F2] hover:bg-[#166fe5] shadow-lg",
		},
		{
			name: "LinkedIn",
			show: waitList.shareOnLinkedin,
			onClick: shareOnLinkedin,
			icon: <LinkedInLogoIcon className="w-5 h-5" />,
			className: "bg-[#0A66C2] hover:bg-[#095196] shadow-lg",
		},
		{
			name: "Email",
			show: waitList.shareOnEmail,
			onClick: shareOnEmail,
			icon: <EnvelopeClosedIcon className="w-5 h-5" />,
			className: "bg-[#EA4335] hover:bg-[#d33c2f] shadow-lg",
		},
		{
			name: "Reddit",
			show: waitList.shareOnReddit,
			onClick: shareOnReddit,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0px"
					y="0px"
					width="50"
					height="50"
					viewBox="0 0 50 50"
					aria-labelledby="redditIconTitle"
				>
					<title id="redditIconTitle">Reddit Share Icon</title>
					<path
						fill="#fff"
						d="M 29 3 C 28.0625 3 27.164063 3.382813 26.5 4 C 25.835938 4.617188 25.363281 5.433594 25 6.40625 C 24.355469 8.140625 24.085938 10.394531 24.03125 13.03125 C 19.234375 13.179688 14.820313 14.421875 11.28125 16.46875 C 10.214844 15.46875 8.855469 14.96875 7.5 14.96875 C 6.089844 14.96875 4.675781 15.511719 3.59375 16.59375 C 1.425781 18.761719 1.425781 22.238281 3.59375 24.40625 L 3.84375 24.65625 C 3.3125 26.035156 3 27.488281 3 29 C 3 33.527344 5.566406 37.585938 9.5625 40.4375 C 13.558594 43.289063 19.007813 45 25 45 C 30.992188 45 36.441406 43.289063 40.4375 40.4375 C 44.433594 37.585938 47 33.527344 47 29 C 47 27.488281 46.6875 26.035156 46.15625 24.65625 L 46.40625 24.40625 C 48.574219 22.238281 48.574219 18.761719 46.40625 16.59375 C 45.324219 15.511719 43.910156 14.96875 42.5 14.96875 C 41.144531 14.96875 39.785156 15.46875 38.71875 16.46875 C 35.195313 14.433594 30.800781 13.191406 26.03125 13.03125 C 26.09375 10.546875 26.363281 8.46875 26.875 7.09375 C 27.164063 6.316406 27.527344 5.757813 27.875 5.4375 C 28.222656 5.117188 28.539063 5 29 5 C 29.460938 5 29.683594 5.125 30.03125 5.40625 C 30.378906 5.6875 30.785156 6.148438 31.3125 6.6875 C 32.253906 7.652344 33.695313 8.714844 36.09375 8.9375 C 36.539063 11.238281 38.574219 13 41 13 C 43.75 13 46 10.75 46 8 C 46 5.25 43.75 3 41 3 C 38.605469 3 36.574219 4.710938 36.09375 6.96875 C 34.3125 6.796875 33.527344 6.109375 32.75 5.3125 C 32.300781 4.851563 31.886719 4.3125 31.3125 3.84375 C 30.738281 3.375 29.9375 3 29 3 Z M 41 5 C 42.667969 5 44 6.332031 44 8 C 44 9.667969 42.667969 11 41 11 C 39.332031 11 38 9.667969 38 8 C 38 6.332031 39.332031 5 41 5 Z M 25 15 C 30.609375 15 35.675781 16.613281 39.28125 19.1875 C 42.886719 21.761719 45 25.226563 45 29 C 45 32.773438 42.886719 36.238281 39.28125 38.8125 C 35.675781 41.386719 30.609375 43 25 43 C 19.390625 43 14.324219 41.386719 10.71875 38.8125 C 7.113281 36.238281 5 32.773438 5 29 C 5 25.226563 7.113281 21.761719 10.71875 19.1875 C 14.324219 16.613281 19.390625 15 25 15 Z M 7.5 16.9375 C 8.203125 16.9375 8.914063 17.148438 9.53125 17.59375 C 7.527344 19.03125 5.886719 20.769531 4.75 22.71875 C 3.582031 21.296875 3.660156 19.339844 5 18 C 5.714844 17.285156 6.609375 16.9375 7.5 16.9375 Z M 42.5 16.9375 C 43.390625 16.9375 44.285156 17.285156 45 18 C 46.339844 19.339844 46.417969 21.296875 45.25 22.71875 C 44.113281 20.769531 42.472656 19.03125 40.46875 17.59375 C 41.085938 17.148438 41.796875 16.9375 42.5 16.9375 Z M 17 22 C 14.800781 22 13 23.800781 13 26 C 13 28.199219 14.800781 30 17 30 C 19.199219 30 21 28.199219 21 26 C 21 23.800781 19.199219 22 17 22 Z M 33 22 C 30.800781 22 29 23.800781 29 26 C 29 28.199219 30.800781 30 33 30 C 35.199219 30 37 28.199219 37 26 C 37 23.800781 35.199219 22 33 22 Z M 17 24 C 18.117188 24 19 24.882813 19 26 C 19 27.117188 18.117188 28 17 28 C 15.882813 28 15 27.117188 15 26 C 15 24.882813 15.882813 24 17 24 Z M 33 24 C 34.117188 24 35 24.882813 35 26 C 35 27.117188 34.117188 28 33 28 C 31.882813 28 31 27.117188 31 26 C 31 24.882813 31.882813 24 33 24 Z M 34.15625 33.84375 C 34.101563 33.851563 34.050781 33.859375 34 33.875 C 33.683594 33.9375 33.417969 34.144531 33.28125 34.4375 C 33.28125 34.4375 32.757813 35.164063 31.4375 36 C 30.117188 36.835938 28.058594 37.6875 25 37.6875 C 21.941406 37.6875 19.882813 36.835938 18.5625 36 C 17.242188 35.164063 16.71875 34.4375 16.71875 34.4375 C 16.492188 34.082031 16.066406 33.90625 15.65625 34 C 15.332031 34.082031 15.070313 34.316406 14.957031 34.632813 C 14.84375 34.945313 14.894531 35.292969 15.09375 35.5625 C 15.09375 35.5625 15.863281 36.671875 17.46875 37.6875 C 19.074219 38.703125 21.558594 39.6875 25 39.6875 C 28.441406 39.6875 30.925781 38.703125 32.53125 37.6875 C 34.136719 36.671875 34.90625 35.5625 34.90625 35.5625 C 35.207031 35.273438 35.296875 34.824219 35.128906 34.441406 C 34.960938 34.058594 34.574219 33.820313 34.15625 33.84375 Z"
					/>
				</svg>
			),
			className: "bg-[#FF4500] hover:bg-[#e53e00] shadow-lg",
		},
	];

	useEffect(() => {
		const fetchTotalSignUps = async () => {
			try {
				const count = await getTotalSignUpsOnWaitList();
				setTotalSignUps(count);
			} catch (error) {
				console.error("Error fetching total sign ups:", error);
			}
		};

		fetchTotalSignUps();
		const interval = setInterval(fetchTotalSignUps, 10000);
		return () => clearInterval(interval);
	}, [getTotalSignUpsOnWaitList]);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(referralLink);
		toast.success("Copied to clipboard");
	};

	return (
		<div className="p-4 min-h-screen bg-gradient-to-b from-primary/5 to-background">
			<motion.div
				className="pt-12 mx-auto space-y-8 max-w-md"
				variants={container}
				initial="hidden"
				animate="show"
			>
				<motion.div variants={item} className="space-y-2 text-center">
					<h1 className="text-4xl font-bold tracking-tight">
						Signed up for{" "}
						<span className="text-primary">
							{waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)}
						</span>
					</h1>
					<p className="text-muted-foreground">
						Share your referral link to move up in line!
					</p>
				</motion.div>

				<motion.div variants={item}>
					<Card className="p-6 shadow-lg">
						<div className="space-y-4">
							<div className="space-y-2">
								<p className="text-sm font-medium text-center">
									Your Unique Referral Link
								</p>
								<div className="flex">
									<Input
										value={referralLink}
										readOnly
										className="rounded-r-none border-r-0 bg-muted"
									/>
									<Button
										className="px-8 rounded-l-none"
										onClick={copyToClipboard}
									>
										Copy
									</Button>
								</div>
							</div>
						</div>
					</Card>
				</motion.div>

				<motion.div variants={item} className="grid grid-cols-2 gap-4">
					<Card className="p-6 shadow-lg">
						<div className="space-y-2 text-center">
							<p className="text-sm font-medium text-muted-foreground">
								Your Position
							</p>
							<motion.p
								className="text-5xl font-bold"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 200, damping: 10 }}
							>
								{signUp.rank}
							</motion.p>
						</div>
					</Card>
					<Card className="p-6 shadow-lg">
						<div className="space-y-2 text-center">
							<p className="text-sm font-medium text-muted-foreground">
								Total Sign Ups
							</p>
							<motion.p
								className="text-5xl font-bold"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 200,
									damping: 10,
									delay: 0.1,
								}}
							>
								{totalSignUps > 0 ? (
									totalSignUps
								) : (
									<span className="flex justify-center items-center">
										<Loader2 className="w-8 h-8 animate-spin" />
									</span>
								)}
							</motion.p>
						</div>
					</Card>
				</motion.div>

				<motion.div variants={item} className="space-y-6">
					{shareButtons.some((button) => button.show) && (
						<div className="space-y-2 text-center">
							<p className="text-sm font-medium">Share with Friends</p>
							<div className="flex flex-wrap gap-4 justify-center">
								{shareButtons.map(
									(button) =>
										button.show && (
											<motion.div
												key={button.name}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<Button
													size="lg"
													className={button.className}
													onClick={button.onClick}
												>
													{button.icon}
													<span className="ml-2">{button.name}</span>
												</Button>
											</motion.div>
										),
								)}
							</div>
						</div>
					)}

					<p className="text-xs text-center text-muted-foreground">
						Widget by{" "}
						<Link href="https://hypeitup.me" className="hover:underline">
							hypeitup.me
						</Link>
					</p>
				</motion.div>
			</motion.div>
		</div>
	);
};
