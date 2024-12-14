const createSignUp = async ({ email, waitList, referralId }) => {
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
				referralId,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await response.json();
		if (response.status !== 200) {
			throw new Error(data.message);
		}
		// set signUp in local storage
		const existingSignUps = JSON.parse(
			localStorage.getItem("waitlist_sign_ups") || "[]",
		);
		existingSignUps.push({
			waitListId: waitList.id,
			hypeSession: uniqueUserId,
		});
		localStorage.setItem("waitlist_sign_ups", JSON.stringify(existingSignUps));
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

const fetchSignUp = async () => {
	const signUp = localStorage.getItem("signUp");
	if (!signUp) {
		return null;
	}

	const signUpJson = JSON.parse(signUp);

	const signUpId = signUpJson.id;

	try {
		const response = await fetch(`/api/v1/sign_up?signUpId=${signUpId}`);
		const data = await response.json();

		if (response.status !== 200) {
			throw new Error(data.message);
		}

		const signUp = data.signUp;
		// write to local storage
		localStorage.setItem("signUp", JSON.stringify(signUp));
		return signUp;
	} catch (error) {
		console.error("Error fetching sign up", error);
		localStorage.removeItem("signUp");
		return null;
	}
};

export { createSignUp, fetchSignUp };
