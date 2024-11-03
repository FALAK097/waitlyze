"use client";

import { createImpression, createSignUp } from "@/utils/fetch/client";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({ uniqueUserId, waitList }) => {
	const theme = useTheme();
	const [mounted, setMounted] = useState(false);
	const isImpressionCreated = useCallback(() => {
		const isImpressionCreated = localStorage.getItem("isImpressionCreated");
		return isImpressionCreated === "true";
	}, []);
	const [email, setEmail] = useState("");
	// Sign up mutation
	const { isSuccess, isLoading, isError, error, refetch } = useQuery({
		enabled: false,
		queryFn: async () => await createSignUp({ email, waitList }),
		queryKey: ["createSignUp", email, waitList.id, uniqueUserId ?? ""],
		retry: 0,
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
