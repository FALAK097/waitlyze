export default function robots() {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/*", "/dashboard/*", "/wait-lists/*"],
		},
		sitemap: "https://hypeitup.me/sitemap.xml",
	};
}
