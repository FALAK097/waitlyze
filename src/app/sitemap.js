export default function sitemap() {
	return [
		{
			url: "https://hypeitup.me",
			priority: 1,
			changeFrequency: "daily",
		},
		{
			url: "https://hypeitup.me/dashboard",
			priority: 0.9,
			changeFrequency: "daily",
		},
		{
			url: "https://hypeitup.me/wait-lists",
			priority: 0.8,
			changeFrequency: "daily",
		},
		{
			url: "https://hypeitup.me/wait-lists/new",
			priority: 0.8,
			changeFrequency: "daily",
		},
		{
			url: "https://hypeitup.me/privacy",
			priority: 0.5,
			lastModified: "November 10, 2024",
		},
		{
			url: "https://hypeitup.me/refund",
			priority: 0.5,
			lastModified: "November 10, 2024",
		},
		{
			url: "https://hypeitup.me/terms",
			priority: 0.5,
			lastModified: "November 10, 2024",
		},
	];
}
