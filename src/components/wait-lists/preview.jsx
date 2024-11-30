"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createImpression, createSignUp } from "@/utils/fetch/client";
import { fetchSignUp } from "@/utils/fetch/client/sign-ups";
import { InstagramLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, MessageCircle } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
	const isImpressionCreated = useCallback(() => {
		const isImpressionCreated = localStorage.getItem("isImpressionCreated");
		return isImpressionCreated === "true";
	}, []);
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
		// fetch sign up from local storage
		const signUp = localStorage.getItem("signUp");
		if (signUp) {
			return JSON.parse(signUp);
		}
		return null;
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
		if (uniqueUserId) {
			let hypeSession = localStorage.getItem("hypeSession");
			if (!hypeSession && !isImpressionCreated()) {
				localStorage.setItem("hypeSession", uniqueUserId);
				hypeSession = uniqueUserId;
				handleCreateImpression();
			}
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
									<MessageCircle className="w-5 h-5" />
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
