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
        country: "US",
        city: "New York",
        region: "NY",
        latitude: "40.7128",
        longitude: "-74.0060",
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
      region: geo.region || undefined,
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

    if (process.env.NODE_ENV === "production") {
      console.info("Geolocation data retrieved successfully:", {
        hasCountry: !!formattedGeo.country,
        hasCity: !!formattedGeo.city,
        hasCoordinates: !!(formattedGeo.latitude && formattedGeo.longitude),
      });
    }

    return formattedGeo;
  } catch (error) {
    console.error("Error in getGeoInfo:", error);
    return {};
  }
};

export const getTimeZone = async (city, request) => {
  try {
    if (city) {
      const timezones = ct.getAllTimezones();
      const matchingTimezone = Object.values(timezones).find((tz) =>
        tz.name.toLowerCase().includes(city.toLowerCase())
      );

      if (matchingTimezone) {
        return matchingTimezone.name;
      }
    }

    const geo = getGeoInfo(request);
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
