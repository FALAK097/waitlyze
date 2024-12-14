"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createImpression, createSignUp } from "@/utils/fetch/client";
import { fetchSignUp } from "@/utils/fetch/client/sign-ups";
import { InstagramLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({
	uniqueUserId,
	waitList,
	getTotalSignUpsOnWaitList,
}) => {
	const theme = useTheme();
	const [mounted, setMounted] = useState(false);
	const searchParams = useSearchParams();
	const referralId = searchParams.get("r");
	const isImpressionCreated = useMemo(() => {
		if (typeof window === "undefined") return;
		const existingImpressions = JSON.parse(
			localStorage.getItem("waitlist_impressions") || "[]",
		);
		return existingImpressions.some(
			(impression) => impression.waitListId === waitList.id,
		);
	}, [waitList.id]);
	const [email, setEmail] = useState("");
	// Sign up mutation
	const { isSuccess, isLoading, isError, error, refetch } = useQuery({
		enabled: false,
		queryFn: async () => await createSignUp({ email, waitList, referralId }),
		queryKey: ["createSignUp", email, waitList.id, uniqueUserId ?? ""],
		retry: 0,
	});
	// fetch sign up
	const {
		isSuccess: fetchSignUpSuccess,
		isLoading: fetchSignUpLoading,
		isError: fetchSignUpError,
		error: fetchSignUpErrorData,
		refetch: fetchSignUpRefetch,
	} = useQuery({
		enabled: false,
		queryFn: async () => await fetchSignUp(),
		queryKey: ["fetchSignUp"],
		retry: 0,
	});
	const [signUp, setSignUp] = useState(() => {
		if (typeof window === "undefined") return;
		// fetch sign up from local storage
		const existingSignups = JSON.parse(
			localStorage.getItem("waitlist_sign_ups") || "[]",
		);
		return existingSignups.find((signUp) => signUp.waitListId === waitList.id);
	});
	// Impression mutation
	const {
		isSuccess: impressionSuccess,
		isLoading: impressionLoading,
		isError: impressionError,
		error: impressionErrorData,
		refetch: impressionRefetch,
	} = useQuery({
		enabled: false,
		queryFn: async () => await createImpression({ waitList }),
		queryKey: ["createImpression", waitList.id, isImpressionCreated],
		retry: false,
	});

	const handleSignUp = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		await refetch();
		setTimeout(() => {
			const signUp = localStorage.getItem("signUp");
			if (signUp) setSignUp(JSON.parse(signUp));
			else setSignUp(null);
		}, 1000);
	};

	const handleCreateImpression = useCallback(async () => {
		if (impressionLoading) return;
		await impressionRefetch();
	}, [impressionLoading, impressionRefetch]);

	useEffect(() => {
		if (isSuccess && mounted) toast.success(waitList.successMessage);
	}, [mounted, isSuccess, waitList.successMessage]);

	useEffect(() => {
		if (isError && mounted) {
			if (error) toast.error(error.message);
			else toast.error("Failed to sign up, Please try again later");
		}
	}, [mounted, isError, error]);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	useEffect(() => {
		theme.setTheme("light");
	}, [theme]);

	useEffect(() => {
		// check if uniqueUserId is available & hypeSession is not set in storage
		if (!uniqueUserId) return;
		let hypeSession = localStorage.getItem("hypeSession");
		if (!hypeSession) {
			hypeSession = uniqueUserId;
			localStorage.setItem("hypeSession", uniqueUserId);
		}
		if (!isImpressionCreated) {
			handleCreateImpression();
		}
	}, [uniqueUserId, handleCreateImpression, isImpressionCreated]);

	useEffect(() => {
		const fetchSignUpInterval = setInterval(() => {
			fetchSignUpRefetch();
			// check if sign up is success
			if (fetchSignUpSuccess) {
				// set sign up to state from local storage
				const signUp = localStorage.getItem("signUp");
				if (signUp) setSignUp(JSON.parse(signUp));
				else setSignUp(null);
			}
		}, 10000);
		return () => clearInterval(fetchSignUpInterval);
	}, [fetchSignUpRefetch, fetchSignUpSuccess]);

	if (signUp) {
		return (
			<ReferralPreview
				signUp={signUp}
				waitList={waitList}
				getTotalSignUpsOnWaitList={getTotalSignUpsOnWaitList}
			/>
		);
	}

	return (
		<div
			style={{
				backgroundColor: waitList.mainBgColor,
			}}
			className="flex flex-col items-center justify-center h-screen"
		>
			<SignUpForm
				email={email}
				waitList={waitList}
				onSubmit={handleSignUp}
				setEmail={setEmail}
				isLoading={isLoading}
			/>
		</div>
	);
};

const ReferralPreview = ({ signUp, waitList, getTotalSignUpsOnWaitList }) => {
	const referralLink = `${window.location.origin}/forms/${waitList.id}?r=${signUp.uniqueUserId}`;
	const [totalSignUps, setTotalSignUps] = useState(0);

	useEffect(() => {
		getTotalSignUpsOnWaitList().then((totalSignUps) => {
			setTotalSignUps(totalSignUps);
		});
		const interval = setInterval(() => {
			getTotalSignUpsOnWaitList().then((totalSignUps) => {
				setTotalSignUps(totalSignUps);
			});
		}, 10000);
		return () => clearInterval(interval);
	}, [getTotalSignUpsOnWaitList]);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(referralLink);
		toast.success("Copied to clipboard");
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

	return (
		<div className="min-h-screen p-4 bg-gradient-to-b from-primary/5 to-background">
			<motion.div
				className="max-w-md pt-12 mx-auto space-y-8"
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
										className="border-r-0 rounded-r-none bg-muted"
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
									<span className="flex items-center justify-center">
										<Loader2 className="w-8 h-8 animate-spin" />
									</span>
								)}
							</motion.p>
						</div>
					</Card>
				</motion.div>

				<motion.div variants={item} className="space-y-6">
					<div className="space-y-2 text-center">
						<p className="text-sm font-medium">Share with Friends</p>
						<div className="flex flex-wrap justify-center gap-4">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									size="lg"
									className="bg-[#1DA1F2] hover:bg-[#1a8cd8] shadow-lg"
									onClick={shareOnTwitter}
								>
									<TwitterLogoIcon className="w-5 h-5" />
									<span className="ml-2">Twitter</span>
								</Button>
							</motion.div>
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									size="lg"
									className="bg-[#25D366] hover:bg-[#20bd5a] shadow-lg"
									onClick={shareOnWhatsApp}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										fill="none"
										viewBox="0 0 24 25"
										aria-hidden="false"
										role="img"
										aria-label="WhatsApp Logo"
									>
										<path
											fill="currentColor"
											d="M9.127 8.206c.172.006.362.015.543.417.123.274.33.785.496 1.193.123.302.223.548.248.6.06.12.1.262.02.423l-.034.07c-.06.123-.104.213-.207.332l-.125.15c-.083.101-.165.202-.237.273-.121.12-.247.252-.106.493.14.242.625 1.032 1.343 1.672.773.69 1.444.98 1.784 1.128q.1.042.159.071c.241.12.382.1.523-.06.14-.162.603-.706.764-.947.162-.242.322-.202.544-.121.221.08 1.408.665 1.65.785l.133.066c.168.08.282.135.33.216.06.101.06.585-.14 1.149-.202.564-1.188 1.108-1.63 1.148l-.13.014c-.409.048-.925.109-2.769-.619-2.27-.895-3.767-3.115-4.075-3.57q-.037-.057-.05-.075l-.003-.004c-.131-.175-.984-1.315-.984-2.494 0-1.111.547-1.694.798-1.963l.048-.051a.89.89 0 0 1 .644-.302z"
										/>
										<path
											fill="currentColor"
											fill-rule="evenodd"
											d="m2.339 22.5 1.371-5.007a9.65 9.65 0 0 1-1.29-4.83C2.422 7.333 6.758 3 12.086 3a9.6 9.6 0 0 1 6.837 2.834 9.6 9.6 0 0 1 2.829 6.836c-.003 5.327-4.339 9.663-9.666 9.663h-.004a9.66 9.66 0 0 1-4.62-1.177zm9.75-17.868c-4.432 0-8.036 3.603-8.037 8.03a8 8 0 0 0 1.228 4.275l.191.304-.811 2.963 3.04-.797.294.174a8 8 0 0 0 4.089 1.12h.003c4.428 0 8.032-3.603 8.033-8.032a7.98 7.98 0 0 0-2.35-5.682 7.98 7.98 0 0 0-5.68-2.355"
											clip-rule="evenodd"
										/>
									</svg>
									<span className="ml-2">WhatsApp</span>
								</Button>
							</motion.div>
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									size="lg"
									className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 shadow-lg"
									onClick={shareOnInstagram}
								>
									<InstagramLogoIcon className="w-5 h-5" />
									<span className="ml-2">Instagram</span>
								</Button>
							</motion.div>
						</div>
					</div>

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
