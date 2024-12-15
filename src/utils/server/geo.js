process.env.GEODATADIR = "./public/data";

import geoip from "geoip-lite";
import { headers } from "next/headers";

export const getIpAddress = () => {
	const headersList = headers();
	const ip = (headersList.get("x-forwarded-for") ?? "127.0.0.1")
		.split(",")[0]
		.trim();
	return ip;
};

export const getGeoInfo = (ip) => {
	const geo = geoip.lookup(ip);
	return geo;
};
