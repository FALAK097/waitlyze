const createImpression = async ({ email, waitList }) => {
	let createImpressionResponse = {
		success: false,
		message: "Failed to create a Impression, Please try again later",
	};
	try {
		const response = await fetch("/api/v1/impressions", {
			method: "POST",
			body: JSON.stringify({ waitListId: waitList.id }),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await response.json();
		if (response.status !== 200) {
			throw new Error(data.message);
		}
		createImpressionResponse = {
			success: true,
			message: waitList.successMessage,
		};
	} catch (error) {
		console.error("Failed to create a Impression, Please try again later");
	}
	if (!createImpressionResponse.success) {
		throw new Error(createImpressionResponse.message);
	}
	return createImpressionResponse;
};

export { createImpression };
