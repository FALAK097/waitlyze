"use client";

import { createImpression, createSignUp } from "@/utils/fetch/client";
import { fetchSignUp } from "@/utils/fetch/client/sign-ups";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ReferralPreview } from "./referral-preview";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({
	uniqueUserId,
	waitList,
	getTotalSignUpsOnWaitList,
	initialSignUpsCount,
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
		if (!mounted) return;
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
	}, [uniqueUserId, handleCreateImpression, isImpressionCreated, mounted]);

	useEffect(() => {
		if (!mounted) return;
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
	}, [fetchSignUpRefetch, fetchSignUpSuccess, mounted]);

	if (signUp) {
		return (
			<ReferralPreview
				signUp={signUp}
				waitList={waitList}
				getTotalSignUpsOnWaitList={async () => {
					try {
						return await getTotalSignUpsOnWaitList();
					} catch (error) {
						console.error("Error getting total sign ups:", error);
						return 0;
					}
				}}
				initialSignUpsCount={initialSignUpsCount}
			/>
		);
	}

	return (
		<div
			style={{
				backgroundColor: waitList.mainBgColor,
			}}
			className="flex flex-col justify-center items-center h-screen"
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
