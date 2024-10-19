"use client";

import { createSignUp } from "@/utils/fetch/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({ uniqueUserId, waitList }) => {
	const [mounted, setMounted] = useState(false);
	const [email, setEmail] = useState("");
	const { isSuccess, isLoading, isError, error, refetch } = useQuery({
		enabled: false,
		queryFn: async () => await createSignUp({ email, waitList }),
		queryKey: ["createSignUp", email, waitList, uniqueUserId ?? ""],
		retry: 0,
	});
	const handleSignUp = async (e) => {
		e.preventDefault();
		if (isLoading) return;
		await refetch();
	};

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
