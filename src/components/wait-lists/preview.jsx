"use client";

import toast from "react-hot-toast";
import { SignUpForm } from "./sign-up-form";

export const Preview = ({ waitList }) => {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<SignUpForm
				waitList={waitList}
				onSubmit={(e) => {
					e.preventDefault();
					toast.success(waitList.successMessage, {
						position: "top-center",
					});
				}}
			/>
		</div>
	);
};
