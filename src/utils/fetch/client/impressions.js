const LS_PREFIX = "wlz_v1:";

const createImpression = async ({ waitList }) => {
	let uniqueUserId = localStorage.getItem(`${LS_PREFIX}hypeSession`);

	if (!uniqueUserId) {
		uniqueUserId = crypto.randomUUID();
		localStorage.setItem(`${LS_PREFIX}hypeSession`, uniqueUserId);
	}

	const existingImpressions = JSON.parse(
		localStorage.getItem(`${LS_PREFIX}waitlist_impressions`) || "[]",
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
			`${LS_PREFIX}waitlist_impressions`,
			JSON.stringify(existingImpressions),
		);
		return data;
	} else {
		throw new Error(data.message);
	}
};

export { createImpression };
