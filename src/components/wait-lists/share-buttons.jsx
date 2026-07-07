"use client";

import { Button } from "@/components/ui/button";
import {
	EnvelopeClosedIcon,
	InstagramLogoIcon,
	LinkedInLogoIcon,
	TwitterLogoIcon,
} from "@radix-ui/react-icons";
import { m } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export const ShareButtons = ({ waitList, referralLink }) => {
	const shareText = `I'm on the waitlist for ${waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
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
		const text = `I'm on the waitlist for ${waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
			}! Join me and move up in line: ${referralLink}`;
		const xUrl = `https://x.com/intent/post?text=${text}`;
		window.open(xUrl, "_blank");
	};

	const shareOnWhatsApp = () => {
		const text = `I'm on the waitlist for ${waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
			}! Join me and move up in line: ${referralLink}`;
		const whatsAppUrl = `https://wa.me/?text=${text}`;
		window.open(whatsAppUrl, "_blank");
	};

	const shareOnInstagram = () => {
		const text = `I'm on the waitlist for ${waitList.name.charAt(0).toUpperCase() + waitList.name.slice(1)
			}! Join me and move up in line: ${referralLink}`;
		navigator.clipboard.writeText(text);
		toast.success("Text copied! Share it on your Instagram story or post");
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
						d="M4.868,43.303l2.694-9.835C5.9,30.59,5.0,27.3,5.0,23.979C5.032,13.5,13.5,5,24.0,5c5.079,0.0,9.8,2.0,13.43,5.566c3.584,3.6,5.6,8.4,5.6,13.428c-0.0,10.5-8.5,18.98-19.0,18.98c-0.0,0,0,0,0,0h-0.008c-3.2-0.0,6.3-0.8,9.1-2.311L4.868,43.303z"
					/>
					<path
						fill="#fff"
						d="M4.868,43.803c-0.1,0-0.26-0.1-0.4-0.148c-0.1-0.1-0.2-0.3-0.1-0.483l2.639-9.636c-1.6-2.9-2.5-6.2-2.5-9.556C4.532,13.2,13.3,4.5,24.0,4.5c5.21,0.0,10.1,2.0,13.8,5.713c3.679,3.7,5.7,8.6,5.7,13.781c-0.0,10.7-8.7,19.48-19.5,19.48c-3.2-0.0-6.3-0.8-9.1-2.277l-9.9,2.589C4.953,43.8,4.9,43.8,4.9,43.803z"
					/>
					<path
						fill="#cfd8dc"
						d="M24.014,5c5.079,0.0,9.8,2.0,13.43,5.566c3.584,3.6,5.6,8.4,5.6,13.428c-0.0,10.5-8.5,18.98-19.0,18.98h-0.008c-3.2-0.0-6.3-0.8-9.1-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.0,27.3,5.0,23.979C5.032,13.5,13.5,5,24.0,5 M24.014,42.974C24.014,43.0,24.0,43.0,24.0,42.974C24.014,43.0,24.0,43.0,24.0,43.0 M24.014,42.974C24.014,43.0,24.0,43.0,24.0,42.974C24.014,43.0,24.0,43.0,24.0,43.0 M24.014,4C24.014,4,24.0,4,24.0,4C12.998,4,4.0,13.0,4.0,23.979c-0.0,3.4,0.8,6.7,2.5,9.622l-2.6,9.439c-0.1,0.3,0.0,0.7,0.3,0.967c0.19,0.2,0.4,0.3,0.7,0.297c0.085,0,0.17-0.0,0.3-0.033l9.687-2.54c2.828,1.5,6.0,2.2,9.2,2.244c11.024,0,19.99-9.0,20.0-19.98c0.002-5.3-2.1-10.4-5.8-14.135C34.378,6.1,29.4,4.0,24.0,4L24.014,4z"
					/>
					<path
						fill="#40c351"
						d="M35.176,12.832c-2.98-3.0-6.9-4.6-11.2-4.626c-8.7,0-15.8,7.1-15.8,15.774c-0.0,3.0,0.8,5.9,2.4,8.396l0.376,0.597l-1.6,5.821l5.973-1.566l0.577,0.342c2.422,1.4,5.2,2.2,8.0,2.199h0.006c8.698,0,15.8-7.1,15.78-15.776C39.795,19.8,38.2,15.8,35.2,12.832z"
					/>
					<path
						fill="#fff"
						fillRule="evenodd"
						d="M19.268,16.045c-0.4-0.79-0.7-0.8-1.1-0.82c-0.3-0.0-0.6-0.0-0.9-0.011c-0.3,0-0.83,0.1-1.3,0.594c-0.4,0.5-1.7,1.6-1.7,3.956c0,2.3,1.7,4.59,1.9,4.906c0.237,0.3,3.3,5.3,8.1,7.161c4.007,1.58,4.8,1.3,5.7,1.187c0.87-0.1,2.8-1.1,3.2-2.255c0.395-1.1,0.4-2.1,0.3-2.255c-0.1-0.2-0.4-0.3-0.9-0.554s-2.8-1.4-3.2-1.543c-0.4-0.2-0.8-0.2-1.1,0.238c-0.3,0.5-1.2,1.5-1.5,1.859c-0.3,0.3-0.6,0.4-1.0,0.119c-0.5-0.2-2.0-0.7-3.8-2.354c-1.41-1.3-2.4-2.81-2.6-3.285c-0.3-0.5-0.03-0.7,0.2-0.968c0.213-0.2,0.5-0.6,0.7-0.831c0.237-0.3,0.3-0.5,0.5-0.791c0.158-0.3,0.1-0.6-0.04-0.831C20.612,19.3,19.69,17.0,19.3,16.045z"
						clipRule="evenodd"
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
				"bg-linear-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 shadow-lg",
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
						d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.1,0.7-3.9,2.6-3.915h3.119v-4.359c-0.5-0.1-1.7-0.2-3.9-0.236c-4.6,0-7.3,2.4-7.3,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.9,23.0,43,24,43c0.875,0,1.7-0.08,2.6-0.194V29.036z"
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
						d="M 29 3 C 28.1 3 27.2 3.4 26.5 4 C 25.8 4.6 25.4 5.4 25 6.4 C 24.4 8.1 24.1 10.4 24.0 13.0 C 19.2 13.2 14.8 14.4 11.3 16.5 C 10.2 15.5 8.9 15.0 7.5 15.0 C 6.1 15.0 4.7 15.5 3.6 16.6 C 1.4 18.8 1.4 22.2 3.6 24.4 L 3.8 24.7 C 3.3 26.0 3 27.5 3 29 C 3 33.5 5.6 37.6 9.6 40.4 C 13.6 43.3 19.0 45 25 45 C 31.0 45 36.4 43.3 40.4 40.4 C 44.4 37.6 47 33.5 47 29 C 47 27.5 46.7 26.0 46.2 24.7 L 46.4 24.4 C 48.6 22.2 48.6 18.8 46.4 16.6 C 45.3 15.5 43.9 15.0 42.5 15.0 C 41.1 15.0 39.8 15.5 38.7 16.5 C 35.2 14.4 30.8 13.2 26.0 13.0 C 26.1 10.5 26.4 8.5 26.9 7.1 C 27.2 6.3 27.5 5.8 27.9 5.4 C 28.2 5.1 28.5 5 29 5 C 29.5 5 29.7 5.1 30.0 5.4 C 30.4 5.7 30.8 6.1 31.3 6.7 C 32.3 7.7 33.7 8.7 36.1 8.9 C 36.5 11.2 38.6 13 41 13 C 43.75 13 46 10.75 46 8 C 46 5.25 43.75 3 41 3 C 38.6 3 36.6 4.7 36.1 7.0 C 34.3 6.8 33.5 6.1 32.75 5.3 C 32.3 4.9 31.9 4.3 31.3 3.8 C 30.7 3.4 29.9 3 29 3 Z M 41 5 C 42.7 5 44 6.3 44 8 C 44 9.7 42.7 11 41 11 C 39.3 11 38 9.7 38 8 C 38 6.3 39.3 5 41 5 Z M 25 15 C 30.6 15 35.7 16.6 39.3 19.2 C 42.9 21.8 45 25.2 45 29 C 45 32.8 42.9 36.2 39.3 38.8 C 35.7 41.4 30.6 43 25 43 C 19.4 43 14.3 41.4 10.7 38.8 C 7.1 36.2 5 32.8 5 29 C 5 25.2 7.1 21.8 10.7 19.2 C 14.3 16.6 31.9 24 33 24 Z M 34.2 33.8 C 34.1 33.9 34.1 33.9 34 33.9 C 33.7 33.9 33.4 34.1 33.3 34.4 C 33.3 34.4 32.8 35.2 31.4 36 C 30.1 36.8 28.1 37.7 25 37.7 C 21.9 37.7 19.9 36.8 18.6 36 C 17.2 35.2 16.7 34.4 16.7 34.4 C 16.5 34.1 16.1 33.9 15.7 34 C 15.3 34.1 15.1 34.3 15.0 34.6 C 14.8 34.9 14.9 35.3 15.1 35.6 C 15.1 35.6 15.9 36.7 17.5 37.7 C 19.1 38.7 21.6 39.7 25 39.7 C 28.4 39.7 30.9 38.7 32.5 37.7 C 34.1 36.7 34.9 35.6 34.9 35.6 C 35.2 35.3 35.3 34.8 35.1 34.4 C 35.0 34.1 34.6 33.8 34.2 33.8 Z"
					/>
				</svg>
			),
			className: "bg-[#FF4500] hover:bg-[#e53e00] shadow-lg",
		},
	];

	return (
		<m.div variants={item} className="space-y-6">
			{shareButtons.some((button) => button.show) && (
				<div className="space-y-2 text-center">
					<p className="text-sm font-medium">Share with Friends</p>
					<div className="flex flex-wrap gap-4 justify-center">
						{shareButtons.map(
							(button) =>
								button.show && (
									<m.div
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
									</m.div>
								),
						)}
					</div>
				</div>
			)}

			{waitList.showBranding && (
				<p className="text-xs text-center text-muted-foreground">
					Widget by{" "}
					<Link href="https://waitlyze.falakgala.dev" className="hover:underline">
						Waitlyze
					</Link>
				</p>
			)}
		</m.div>
	);
};
