"use client";

import { createImpression, createSignUp } from "@/utils/fetch/client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({ impressionCreated, uniqueUserId, waitList }) => {
	const [mounted, setMounted] = useState(false);
	const [email, setEmail] = useState("");
	// Sign up mutation
	const { isSuccess, isLoading, isError, error, refetch } = useQuery({
		enabled: false,
		queryFn: async () => await createSignUp({ email, waitList }),
		queryKey: ["createSignUp", email, waitList, uniqueUserId ?? ""],
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
		queryFn: async () => await createImpression({ waitList, uniqueUserId }),
		queryKey: ["createSignUp", waitList, uniqueUserId ?? ""],
		retry: 0,
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
		if (mounted && !impressionCreated) {
			setTimeout(() => {
				handleCreateImpression();
			}, 2500);
		}
	}, [mounted, impressionCreated, handleCreateImpression]);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	return (
		<div className="flex flex-col items-center justify-center h-screen">
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
