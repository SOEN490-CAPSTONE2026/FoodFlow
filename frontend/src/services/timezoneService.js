/**
 * Timezone inference service using Google Maps Geocoding and Time Zone APIs
 * Automatically detects timezone from address during registration
 */

/**
 * Infer timezone from a physical address using Google Maps APIs
 * @param {string} address - Full address string (e.g., "123 Main St, Montreal, QC H3A 0G4, Canada")
 * @returns {Promise<string>} - Timezone identifier (e.g., "America/Toronto")
 */
const GOOGLE_GEOCODE_URL =
  'https://maps.googleapis.com/maps/api/geocode/json?address=';
const GOOGLE_TIMEZONE_URL =
  'https://maps.googleapis.com/maps/api/timezone/json?location=';

const getAddressComponent = (components = [], type) =>
  components.find(component => component.types?.includes(type));

const geocodeAddress = async (address, apiKey) => {
  const geocodeUrl = `${GOOGLE_GEOCODE_URL}${encodeURIComponent(address)}&key=${apiKey}`;
  const geocodeResponse = await fetch(geocodeUrl);
  const geocodeData = await geocodeResponse.json();

  if (
    geocodeData.status !== 'OK' ||
    !Array.isArray(geocodeData.results) ||
    geocodeData.results.length === 0
  ) {
    return null;
  }

  return geocodeData.results[0];
};

const fetchTimezoneForCoordinates = async (lat, lng, apiKey) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const timezoneUrl = `${GOOGLE_TIMEZONE_URL}${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
  const timezoneResponse = await fetch(timezoneUrl);
  const timezoneData = await timezoneResponse.json();

  if (timezoneData.status !== 'OK' || !timezoneData.timeZoneId) {
    return null;
  }

  return timezoneData.timeZoneId;
};

/**
 * Infer region details and timezone from an address.
 * Returns best-effort city/country with timezone fallback to browser timezone.
 */
export const inferRegionFromAddress = async address => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    const browserTimezone = getBrowserTimezone();
    return {
      timezone: browserTimezone,
      city: '',
      country: '',
      countryCode: '',
      source: 'browser-fallback',
    };
  }

  if (!address || address.trim().length === 0) {
    const browserTimezone = getBrowserTimezone();
    return {
      timezone: browserTimezone,
      city: '',
      country: '',
      countryCode: '',
      source: 'browser-fallback',
    };
  }

  try {
    const geocoded = await geocodeAddress(address, apiKey);
    if (!geocoded?.geometry?.location) {
      const browserTimezone = getBrowserTimezone();
      return {
        timezone: browserTimezone,
        city: '',
        country: '',
        countryCode: '',
        source: 'browser-fallback',
      };
    }

    const location = geocoded.geometry.location;
    const { lat, lng } = location;
    const components = geocoded.address_components || [];
    const cityComponent =
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'postal_town') ||
      getAddressComponent(components, 'administrative_area_level_2');
    const countryComponent = getAddressComponent(components, 'country');

    const timezone =
      (await fetchTimezoneForCoordinates(lat, lng, apiKey)) ||
      getBrowserTimezone();

    return {
      timezone,
      city: cityComponent?.long_name || '',
      country: countryComponent?.long_name || '',
      countryCode: countryComponent?.short_name || '',
      source: 'google',
    };
  } catch (error) {
    const browserTimezone = getBrowserTimezone();
    return {
      timezone: browserTimezone,
      city: '',
      country: '',
      countryCode: '',
      source: 'browser-fallback',
    };
  }
};

export const inferTimezoneFromAddress = async address => {
  const region = await inferRegionFromAddress(address);
  return region?.timezone || getBrowserTimezone();
};

/**
 * Get timezone from browser's Intl API as fallback
 * @returns {string} - Timezone identifier from browser (e.g., "America/Toronto")
 */
export const getBrowserTimezone = () => {
  try {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`Using browser timezone: ${browserTz}`);
    return browserTz;
  } catch (error) {
    console.error('Error getting browser timezone:', error);
    // Ultimate fallback to UTC
    return 'UTC';
  }
};

/**
 * Validate if a timezone string is valid
 * @param {string} timezone - Timezone identifier to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidTimezone = timezone => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};
