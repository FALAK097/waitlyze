const createImpression = async ({ waitList }) => {
	let uniqueUserId = localStorage.getItem("hypeSession");

	if (!uniqueUserId) {
		uniqueUserId = crypto.randomUUID();
		localStorage.setItem("hypeSession", uniqueUserId);
	}

	const existingImpressions = JSON.parse(
		localStorage.getItem("waitlist_impressions") || "[]",
	);
	const hasCreatedImpression = existingImpressions.some(
		(impression) => impression.waitListId === waitList.id,
	);

	if (hasCreatedImpression) {
		return { created: false, alreadyExists: true };
	}

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
		existingImpressions.push({
			waitListId: waitList.id,
			hypeSession: uniqueUserId,
		});
		localStorage.setItem(
			"waitlist_impressions",
			JSON.stringify(existingImpressions),
		);
		return data;
	} else {
		throw new Error(data.message);
	}
};

export { createImpression };
