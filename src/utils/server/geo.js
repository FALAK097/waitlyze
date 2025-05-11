import ct from "countries-and-timezones";
import { geolocation } from "@vercel/functions";

export const getIpAddress = (request) => {
  const vercelHeaders = request.headers;
  return vercelHeaders.get("x-forwarded-for") || "::1";
};

export const getGeoInfo = (request) => {
  try {
    if (process.env.NODE_ENV === "development") {
      return {
        country: "IN",
        city: "Thane",
        latitude: "19.2183",
        longitude: "72.9781",
      };
    }

    const geo = geolocation(request);

    if (!geo) {
      console.warn("No geolocation data available from Vercel");
      return {};
    }

    const formattedGeo = {
      country: geo.country || undefined,
      city: geo.city || undefined,
      latitude:
        typeof geo.latitude === "number"
          ? geo.latitude.toString()
          : typeof geo.latitude === "string"
          ? geo.latitude
          : undefined,
      longitude:
        typeof geo.longitude === "number"
          ? geo.longitude.toString()
          : typeof geo.longitude === "string"
          ? geo.longitude
          : undefined,
    };

    return formattedGeo;
  } catch (error) {
    console.error("Error in getGeoInfo:", error);
    return {};
  }
};

export const getTimeZone = async (city, request) => {
  try {
    console.log("[TimeZone Debug] Input city:", city);

    if (city) {
      const timezones = ct.getAllTimezones();
      console.log("[TimeZone Debug] Searching for city:", city);
      const matchingTimezone = Object.values(timezones).find((tz) =>
        tz.name.toLowerCase().includes(city.toLowerCase())
      );

      if (matchingTimezone) {
        console.log(
          "[TimeZone Debug] Found timezone by city:",
          matchingTimezone.name
        );
        return matchingTimezone.name;
      }
    }

    const geo = getGeoInfo(request);
    console.log("[TimeZone Debug] Geo info:", geo);

    if (geo?.country) {
      console.log(
        "[TimeZone Debug] Looking up timezone for country:",
        geo.country
      );
      const countryCode = geo.country.toUpperCase();
      const countryTimezones = ct.getTimezonesForCountry(countryCode);
      console.log("[TimeZone Debug] Found timezones:", countryTimezones);

      if (countryTimezones && countryTimezones.length > 0) {
        console.log(
          "[TimeZone Debug] Selected timezone:",
          countryTimezones[0].name
        );
        return countryTimezones[0].name;
      }
    }

    console.log("[TimeZone Debug] No timezone found");
    return null;
  } catch (error) {
    console.error("[TimeZone Debug] Error:", error);
    return null;
  }
};
