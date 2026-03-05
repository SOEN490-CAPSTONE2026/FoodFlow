import {
  inferTimezoneFromAddress,
  getBrowserTimezone,
  isValidTimezone,
} from '../timezoneService';

describe('timezoneService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, REACT_APP_GOOGLE_MAPS_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getBrowserTimezone', () => {
    it('should return the browser timezone', () => {
      const timezone = getBrowserTimezone();
      expect(timezone).toBeTruthy();
      expect(typeof timezone).toBe('string');
    });

    it('should return a valid IANA timezone', () => {
      const timezone = getBrowserTimezone();
      expect(isValidTimezone(timezone)).toBe(true);
    });
  });

  describe('isValidTimezone', () => {
    it('should return true for valid IANA timezones', () => {
      expect(isValidTimezone('America/Toronto')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
      expect(isValidTimezone('UTC')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone(null)).toBe(false);
    });
  });

  describe('inferTimezoneFromAddress', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
    });

    it('should return timezone from successful geocoding and timezone API calls', async () => {
      // Mock geocoding API response
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'OK',
            results: [
              {
                geometry: {
                  location: {
                    lat: 43.6532,
                    lng: -79.3832,
                  },
                },
              },
            ],
          }),
        })
        // Mock timezone API response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            timeZoneId: 'America/Toronto',
            status: 'OK',
          }),
        });

      const timezone = await inferTimezoneFromAddress(
        '123 Main St, Toronto, ON, Canada'
      );

      expect(timezone).toBe('America/Toronto');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should return browser timezone if geocoding fails', async () => {
      // Mock geocoding API with ZERO_RESULTS
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ZERO_RESULTS',
          results: [],
        }),
      });

      const timezone = await inferTimezoneFromAddress('Invalid Address');

      expect(timezone).toBe(getBrowserTimezone());
    });

    it('should return browser timezone if timezone API fails', async () => {
      // Mock successful geocoding
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'OK',
            results: [
              {
                geometry: {
                  location: {
                    lat: 43.6532,
                    lng: -79.3832,
                  },
                },
              },
            ],
          }),
        })
        // Mock timezone API with error status
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'REQUEST_DENIED',
          }),
        });

      const timezone = await inferTimezoneFromAddress(
        '123 Main St, Toronto, ON, Canada'
      );

      expect(timezone).toBe(getBrowserTimezone());
    });

    it('should return browser timezone on fetch exception', async () => {
      // Mock fetch to throw error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const timezone = await inferTimezoneFromAddress(
        '123 Main St, Toronto, ON, Canada'
      );

      expect(timezone).toBe(getBrowserTimezone());
    });

    it('should handle empty address', async () => {
      const timezone = await inferTimezoneFromAddress('');
      expect(timezone).toBe(getBrowserTimezone());
    });

    it('should handle null address', async () => {
      const timezone = await inferTimezoneFromAddress(null);
      expect(timezone).toBe(getBrowserTimezone());
    });
  });
});
