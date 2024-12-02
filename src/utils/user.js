export const userRoles = [
	"User",
	"VIP",
	"Early Adopter",
	"Influencer",
	"Beta Tester",
];

export const priorityColors = {
	High: "text-amber-500",
	Medium: "text-purple-500",
	Low: "text-orange-500",
};

export const generateMockUsers = (count) => {
	return Array.from({ length: count }, (_, i) => ({
		id: i + 1,
		name: `User ${i + 1}`,
		avatar: `/avatars/user${i + 1}.jpg`,
		category: userRoles[Math.floor(Math.random() * userRoles.length)],
		referralSource: [
			"Twitter",
			"Direct Link",
			"Email Campaign",
			"Facebook",
			"LinkedIn",
		][Math.floor(Math.random() * 5)],
		priority: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
	}));
};
