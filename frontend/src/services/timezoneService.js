/**
 * Timezone inference service using Google Maps Geocoding and Time Zone APIs
 * Automatically detects timezone from address during registration
 */

/**
 * Infer timezone from a physical address using Google Maps APIs
 * @param {string} address - Full address string (e.g., "123 Main St, Montreal, QC H3A 0G4, Canada")
 * @returns {Promise<string>} - Timezone identifier (e.g., "America/Toronto")
 */
export const inferTimezoneFromAddress = async address => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn(
      'Google Maps API key not found, falling back to browser timezone'
    );
    return getBrowserTimezone();
  }

  if (!address || address.trim().length === 0) {
    console.warn('Empty address provided, falling back to browser timezone');
    return getBrowserTimezone();
  }

  try {
    // Step 1: Geocode address to get lat/lng coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (
      geocodeData.status !== 'OK' ||
      !geocodeData.results ||
      geocodeData.results.length === 0
    ) {
      console.warn(
        'Geocoding failed:',
        geocodeData.status,
        '- Falling back to browser timezone'
      );
      return getBrowserTimezone();
    }

    const location = geocodeData.results[0].geometry.location;
    const { lat, lng } = location;

    console.log(`Geocoded address to coordinates: lat=${lat}, lng=${lng}`);

    // Step 2: Get timezone from coordinates using Google Time Zone API
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
    const timezoneResponse = await fetch(timezoneUrl);
    const timezoneData = await timezoneResponse.json();

    if (timezoneData.status !== 'OK' || !timezoneData.timeZoneId) {
      console.warn(
        'Time Zone API failed:',
        timezoneData.status,
        '- Falling back to browser timezone'
      );
      return getBrowserTimezone();
    }

    const inferredTimezone = timezoneData.timeZoneId;
    console.log(
      `Inferred timezone: ${inferredTimezone} from address: ${address}`
    );

    return inferredTimezone;
  } catch (error) {
    console.error('Error inferring timezone from address:', error);
    // Always fallback to browser timezone on error
    return getBrowserTimezone();
  }
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
