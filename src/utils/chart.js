const getCurrentWeekDates = (startDay = 0) => {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - dayOfWeek + startDay);

	return Array.from({ length: 7 }, (_, i) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	});
};

export const peakInterestData = {
	daily: Array.from({ length: 24 }, (_, i) => ({
		hour: `${i}:00`,
		users: Math.floor(Math.random() * 100),
	})),
	weekly: getCurrentWeekDates().map((date) => ({
		date,
		users: Math.floor(Math.random() * 500) + 100,
	})),
};

export const chartData = [
	{ date: "2024-04-01", desktop: 222, mobile: 150 },
	{ date: "2024-04-02", desktop: 97, mobile: 180 },
	{ date: "2024-04-03", desktop: 167, mobile: 120 },
	{ date: "2024-06-13", desktop: 81, mobile: 130 },
	{ date: "2024-06-14", desktop: 426, mobile: 380 },
	{ date: "2024-06-15", desktop: 307, mobile: 350 },
	{ date: "2024-06-16", desktop: 371, mobile: 310 },
	{ date: "2024-06-17", desktop: 475, mobile: 520 },
	{ date: "2024-06-18", desktop: 107, mobile: 170 },
	{ date: "2024-06-19", desktop: 341, mobile: 290 },
	{ date: "2024-06-20", desktop: 408, mobile: 450 },
	{ date: "2024-06-21", desktop: 169, mobile: 210 },
	{ date: "2024-06-22", desktop: 317, mobile: 270 },
	{ date: "2024-06-23", desktop: 480, mobile: 530 },
	{ date: "2024-06-24", desktop: 132, mobile: 180 },
	{ date: "2024-06-25", desktop: 141, mobile: 190 },
	{ date: "2024-06-26", desktop: 434, mobile: 380 },
	{ date: "2024-06-27", desktop: 448, mobile: 490 },
	{ date: "2024-06-28", desktop: 149, mobile: 200 },
	{ date: "2024-06-29", desktop: 103, mobile: 160 },
	{ date: "2024-06-30", desktop: 446, mobile: 400 },
];

export const signUpData = [
	{ date: "2024-10-01", totalSignups: 100 },
	{ date: "2024-10-02", totalSignups: 150 },
	{ date: "2024-10-03", totalSignups: 200 },
	{ date: "2024-10-04", totalSignups: 250 },
	{ date: "2024-10-05", totalSignups: 300 },
	{ date: "2024-10-06", totalSignups: 350 },
	{ date: "2024-10-07", totalSignups: 400 },
	{ date: "2024-10-08", totalSignups: 450 },
	{ date: "2024-10-09", totalSignups: 500 },
	{ date: "2024-10-10", totalSignups: 600 },
	{ date: "2024-10-11", totalSignups: 650 },
	{ date: "2024-10-12", totalSignups: 700 },
	{ date: "2024-10-13", totalSignups: 750 },
	{ date: "2024-10-14", totalSignups: 800 },
	{ date: "2024-10-15", totalSignups: 900 },
	{ date: "2024-10-16", totalSignups: 950 },
	{ date: "2024-10-17", totalSignups: 1000 },
	{ date: "2024-10-18", totalSignups: 1100 },
	{ date: "2024-10-19", totalSignups: 1200 },
	{ date: "2024-10-20", totalSignups: 1250 },
	{ date: "2024-10-21", totalSignups: 1300 },
	{ date: "2024-10-22", totalSignups: 1350 },
	{ date: "2024-10-23", totalSignups: 1400 },
	{ date: "2024-10-24", totalSignups: 1450 },
	{ date: "2024-10-25", totalSignups: 1500 },
	{ date: "2024-10-26", totalSignups: 1550 },
	{ date: "2024-10-27", totalSignups: 1600 },
	{ date: "2024-10-28", totalSignups: 1650 },
	{ date: "2024-10-29", totalSignups: 1700 },
	{ date: "2024-10-30", totalSignups: 1750 },
	{ date: "2024-10-31", totalSignups: 1800 },
];

export const trafficData = [
	{ name: "Google", user: 4000 },
	{ name: "Direct", user: 3000 },
	{ name: "Instagram", user: 2000 },
	{ name: "LinkedIn", user: 1500 },
	{ name: "Twitter", user: 1000 },
	{ name: "Other", user: 500 },
];

export const geoData = [
	{ name: "India", value: 1000 },
	{ name: "United States", value: 400 },
	{ name: "United Kingdom", value: 300 },
	{ name: "Canada", value: 200 },
	{ name: "Australia", value: 150 },
];

export const userMetricData = [
	{ metric: "Time on Site", A: 120, B: 110, fullMark: 150 },
	{ metric: "Pages per Visit", A: 98, B: 130, fullMark: 150 },
	{ metric: "Bounce Rate", A: 86, B: 130, fullMark: 150 },
	{ metric: "Conversion Rate", A: 99, B: 100, fullMark: 150 },
	{ metric: "Return Visits", A: 85, B: 90, fullMark: 150 },
	{ metric: "Social Shares", A: 65, B: 85, fullMark: 150 },
];

export const chartConfig = {
	views: {
		label: "Page Views",
	},
	desktop: {
		label: "Desktop",
		color: "hsl(var(--primary))",
	},
	mobile: {
		label: "Mobile",
		color: "hsl(var(--chart-5))",
	},
};
