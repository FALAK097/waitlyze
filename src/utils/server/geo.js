import { env } from "@/lib/env.mjs";
import { geolocation, ipAddress } from "@vercel/functions";
import ct from "countries-and-timezones";

export const getIpAddress = () => {
	let ip = "::1";
	if (env.NEXT_PUBLIC_VERCEL_ENV !== "development") {
		ip = ipAddress();
	}
	return ip;
};

export const getGeoInfo = () => {
	return geolocation();
};

export const getTimeZone = async (city) => {
	try {
		// Get all timezones and find the one matching the city
		const timezones = ct.getAllTimezones();
		const matchingTimezone = Object.values(timezones).find((tz) =>
			tz.name.toLowerCase().includes(city.toLowerCase()),
		);

		if (matchingTimezone) {
			return matchingTimezone.name;
		}

		// If no direct match, try to find a timezone for the country
		const geo = getGeoInfo();
		if (geo?.country) {
			const countryTimezones = ct.getTimezonesForCountry(geo.country);
			if (countryTimezones.length > 0) {
				return countryTimezones[0].name;
			}
		}

		return null;
	} catch (error) {
		console.error("Error getting timezone:", error);
		return null;
	}
};
