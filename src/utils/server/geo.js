import geoip from "geoip-lite";
import { headers } from "next/headers";

export const getIpAddress = async () => {
	const headersList = await headers();
	const ip = (headersList.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
	return ip;
};

export const getGeoInfo = async (ip) => {
	const geo = geoip.lookup(ip);
	return geo;
};
