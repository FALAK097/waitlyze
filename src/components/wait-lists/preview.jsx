"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createImpression, createSignUp } from "@/utils/fetch/client";
import { fetchSignUp } from "@/utils/fetch/client/sign-ups";
import { TwitterLogoIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { useTheme } from "next-themes";
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
		const text = `I'm on the waitlist for ${waitList.name}! Join me and move up in line: ${referralLink}`;
		const url = `https://twitter.com/intent/tweet?text=${text}`;
		window.open(url, "_blank");
	};

	const shareOnWhatsApp = () => {
		const text = `I'm on the waitlist for ${waitList.name}! Join me and move up in line: ${referralLink}`;
		const url = `https://wa.me/?text=${text}`;
		window.open(url, "_blank");
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="w-full max-w-md space-y-6">
				<h1 className="text-3xl font-bold text-center">
					Signed up for <span className="text-primary">{waitList.name}</span>
				</h1>

				<Card className="p-6">
					<div className="space-y-4">
						<div className="text-center">
							<p className="text-sm font-medium">Referral Link</p>
							<div className="flex mt-2">
								<Input
									value={referralLink}
									readOnly
									className="rounded-r-none"
								/>
								<Button className="rounded-l-none" onClick={copyToClipboard}>
									Copy
								</Button>
							</div>
						</div>
					</div>
				</Card>

				<div className="flex justify-between">
					<Card className="w-[48%] p-6">
						<p className="text-sm font-medium text-center">Your Position</p>
						<p className="text-5xl font-bold text-center mt-2">{signUp.rank}</p>
					</Card>
					<Card className="w-[48%] p-6">
						<p className="text-sm font-medium text-center">
							People on Waitlist
						</p>
						<p className="text-5xl font-bold text-center mt-2">
							{totalSignUps > 0 ? (
								totalSignUps
							) : (
								<div className="flex items-center justify-center">
									<Loader2 className="w-5 h-5 animate-spin" />
								</div>
							)}
						</p>
					</Card>
				</div>

				<div className="text-center space-y-4">
					<p className="text-sm">
						Share and refer your friends to move up in line!
					</p>
					<div className="flex justify-center space-x-4">
						<Button
							className="bg-blue-600 hover:bg-blue-700"
							onClick={shareOnTwitter}
						>
							<TwitterLogoIcon className="w-5 h-5" />
						</Button>
						<Button
							className="bg-green-600 hover:bg-green-700"
							onClick={shareOnWhatsApp}
						>
							<MessageCircle className="w-5 h-5" />
						</Button>
					</div>
				</div>

				<p className="text-xs text-center text-gray-500">
					Widget by hypeitup.me
				</p>
			</div>
		</div>
	);
};
