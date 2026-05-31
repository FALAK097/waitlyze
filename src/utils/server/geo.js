import ct from "countries-and-timezones";
import geoip from "geoip-lite";

export const getIpAddress = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "::1";
};

export const getGeoInfo = (request) => {
  try {
    if (process.env.NODE_ENV === "development") {
      return {
        country: "IN",
        city: "Thane",
        latitude: "19.2183",
        longitude: "72.9781",
        timezone: "Asia/Kolkata",
      };
    }

    const headers = request.headers;
    const country = headers.get("x-vercel-ip-country");
    const city = headers.get("x-vercel-ip-city");
    const latitude = headers.get("x-vercel-ip-latitude");
    const longitude = headers.get("x-vercel-ip-longitude");
    const timezone = headers.get("x-vercel-ip-timezone");

    if (country || city || timezone) {
      return {
        country: country || undefined,
        city: city || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        timezone: timezone || undefined,
      };
    }

    const ip = getIpAddress(request);
    if (ip && ip !== "::1" && ip !== "127.0.0.1") {
      const geo = geoip.lookup(ip);
      if (geo) {
        return {
          country: geo.country,
          city: geo.city,
          latitude: geo.ll?.[0]?.toString(),
          longitude: geo.ll?.[1]?.toString(),
          timezone: undefined,
        };
      }
    }

    return {};
  } catch (error) {
    console.error("Error in getGeoInfo:", error);
    return {};
  }
};

export const getTimeZone = (city, countryCode, fallbackTimezone) => {
  try {
    if (fallbackTimezone) {
      return fallbackTimezone;
    }

    if (city) {
      const timezones = ct.getAllTimezones();
      const matchingTimezone = Object.values(timezones).find((tz) =>
        tz.name.toLowerCase().includes(city.toLowerCase())
      );
      if (matchingTimezone) {
        return matchingTimezone.name;
      }
    }

    if (countryCode) {
      const countryTimezones = ct.getTimezonesForCountry(
        countryCode.toUpperCase()
      );
      if (countryTimezones && countryTimezones.length > 0) {
        return countryTimezones[0].name;
      }
    }

    return null;
  } catch (error) {
    console.error("[TimeZone] Error:", error);
    return null;
  }
};
