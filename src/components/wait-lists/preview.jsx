"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const FormPreview = ({ waitList }) => {
	const [email, setEmail] = useState("");
	const handleSignUp = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch("/api/sign_up", {
				method: "POST",
				body: JSON.stringify({ email, waitListId: waitList.id }),
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await response.json();
			if (response.status !== 200) {
				throw new Error(data.message);
			}
			console.log("Response data", data);
			toast.success(waitList.successMessage);
		} catch (error) {
			console.error(error);
			// check if the error message is already signed up, status should be 403
			if (error.message === "You have already signed up!")
				return toast.error("You have already signed up!");
			toast.error("Failed to sign up, Please try again later");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<SignUpForm
				waitList={waitList}
				onSubmit={handleSignUp}
				setEmail={setEmail}
			/>
		</div>
	);
};
