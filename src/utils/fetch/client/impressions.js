const createImpression = async ({ waitList }) => {
	let uniqueUserId = localStorage.getItem("hypeSession");

	if (!uniqueUserId) {
		uniqueUserId = crypto.randomUUID();
		localStorage.setItem("hypeSession", uniqueUserId);
	}

	const impressionKey = `impression_${waitList.id}`;
	const hasCreatedImpression = localStorage.getItem(impressionKey);

	if (!hasCreatedImpression) {
		try {
			const response = await fetch("/api/v1/impressions", {
				method: "POST",
				body: JSON.stringify({
					waitListId: waitList.id,
					hypeSession: uniqueUserId,
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (response.status === 200) {
				localStorage.setItem(impressionKey, "true");
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error("Failed to create an Impression", error);
		}
	}
};

export { createImpression };
