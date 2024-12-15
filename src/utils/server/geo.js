import geoip from "geoip-lite";

export const getIpAddress = (req) => {
	const ip = (
		req.headers["x-forwarded-for"] || req.connection.remoteAddress
	).split(",")[0];
	return ip;
};

export const getGeoInfo = (ip) => {
	const geo = geoip.lookup(ip);
	return geo;
};
