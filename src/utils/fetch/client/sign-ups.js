const createSignUp = async ({ email, waitList }) => {
	const uniqueUserId = localStorage.getItem("hypeSession");
	let createSignUpResponse = {
		success: false,
		message: "Failed to sign up, Please try again later",
	};
	try {
		const response = await fetch("/api/v1/sign_up", {
			method: "POST",
			body: JSON.stringify({
				email,
				waitListId: waitList.id,
				hypeSession: uniqueUserId,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await response.json();
		if (response.status !== 200) {
			throw new Error(data.message);
		}
		createSignUpResponse = {
			success: true,
			message: waitList.successMessage,
		};
	} catch (error) {
		console.error(error);
		// check if the error message is already signed up, status should be 403
		if (error.message === "You have already signed up!")
			createSignUpResponse = {
				success: false,
				message: "You have already signed up!",
			};
	}
	if (!createSignUpResponse.success) {
		throw new Error(createSignUpResponse.message);
	}
	return createSignUpResponse;
};

export { createSignUp };
