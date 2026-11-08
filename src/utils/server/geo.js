import { getCloudflareContext } from "@opennextjs/cloudflare";
import ct from "countries-and-timezones";

// Cloudflare may URL-encode city and region metadata. Keep malformed values
// rather than discarding geo data for a request.
const decodeHeader = (value) => {
  if (!value) return value;
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
};

export const getIpAddress = (request) => {
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp.trim();
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
        region: "MH",
        latitude: "19.2183",
        longitude: "72.9781",
        timezone: "Asia/Kolkata",
      };
    }

    const headers = request.headers;
    let edge = {};
    try {
      edge = getCloudflareContext().cf || {};
    } catch {
      // Standard Next.js development and build contexts do not include CF data.
    }
    const country = headers.get("cf-ipcountry") || edge.country;
    const city = decodeHeader(headers.get("cf-ipcity") || edge.city);
    const region = decodeHeader(headers.get("cf-region") || edge.regionCode || edge.region);
    const latitude = headers.get("cf-iplatitude") || edge.latitude;
    const longitude = headers.get("cf-iplongitude") || edge.longitude;
    const timezone = headers.get("cf-timezone") || edge.timezone;

    if (country || city || region || timezone) {
      return {
        country: country || undefined,
        city: city || undefined,
        region: region || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        timezone: timezone || undefined,
      };
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
        tz.name.toLowerCase().includes(city.toLowerCase()),
      );
      if (matchingTimezone) {
        return matchingTimezone.name;
      }
    }

    if (countryCode) {
      const countryTimezones = ct.getTimezonesForCountry(countryCode.toUpperCase());
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
