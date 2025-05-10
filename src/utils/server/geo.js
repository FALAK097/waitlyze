import ct from "countries-and-timezones";

export const getIpAddress = (request) => {
  return request.headers.get("x-ip") || "::1";
};

export const getGeoInfo = (request) => {
  try {
    const headers = request?.headers;
    if (!headers) return {};

    return {
      country: headers.get("x-country") || undefined,
      city: headers.get("x-city") || undefined,
      region: headers.get("x-region") || undefined,
      latitude: parseFloat(headers.get("x-latitude")) || undefined,
      longitude: parseFloat(headers.get("x-longitude")) || undefined,
    };
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
