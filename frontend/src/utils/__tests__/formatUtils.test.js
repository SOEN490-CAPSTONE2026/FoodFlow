import i18n from '../../locales/i18n';
import {
  getCurrentLocale,
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  formatTimeRange,
  formatPickupTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatExpiryDate,
  getDateFormatPattern,
  getNumberFormatInfo,
} from '../formatUtils';

// Mock i18n
jest.mock('../../locales/i18n', () => ({
  language: 'en-US',
}));

describe('formatUtils', () => {
  beforeEach(() => {
    // Reset to English locale before each test
    i18n.language = 'en-US';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getCurrentLocale', () => {
    test('returns en-US for English language', () => {
      i18n.language = 'en';
      expect(getCurrentLocale()).toBe('en-US');
    });

    test('returns fr-FR for French language', () => {
      i18n.language = 'fr';
      expect(getCurrentLocale()).toBe('fr-FR');
    });

    test('returns es-ES for Spanish language', () => {
      i18n.language = 'es';
      expect(getCurrentLocale()).toBe('es-ES');
    });

    test('returns zh-CN for Chinese language', () => {
      i18n.language = 'zh';
      expect(getCurrentLocale()).toBe('zh-CN');
    });

    test('returns ar-SA for Arabic language', () => {
      i18n.language = 'ar';
      expect(getCurrentLocale()).toBe('ar-SA');
    });

    test('returns pt-BR for Portuguese language', () => {
      i18n.language = 'pt';
      expect(getCurrentLocale()).toBe('pt-BR');
    });

    test('handles language code with region (e.g., en-US)', () => {
      i18n.language = 'en-US';
      expect(getCurrentLocale()).toBe('en-US');
    });

    test('returns en-US for unknown language', () => {
      i18n.language = 'unknown';
      expect(getCurrentLocale()).toBe('en-US');
    });

    test('returns en-US when i18n.language is undefined', () => {
      i18n.language = undefined;
      expect(getCurrentLocale()).toBe('en-US');
    });

    test('returns en-US when i18n.language is null', () => {
      i18n.language = null;
      expect(getCurrentLocale()).toBe('en-US');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T10:30:00Z');

    test('formats a Date object', () => {
      const result = formatDate(testDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats a date string', () => {
      const result = formatDate('2024-03-15');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats a timestamp', () => {
      const result = formatDate(testDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null date', () => {
      expect(formatDate(null)).toBe('—');
    });

    test('returns — for undefined date', () => {
      expect(formatDate(undefined)).toBe('—');
    });

    test('returns — for empty string', () => {
      expect(formatDate('')).toBe('—');
    });

    test('returns — for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('—');
    });

    test('accepts custom options', () => {
      const result = formatDate(testDate, { month: 'long', day: 'numeric' });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatDate({});
      expect(result).toBe('—');
    });
  });

  describe('formatTime', () => {
    const testDate = new Date('2024-03-15T14:30:00Z');

    test('formats time from Date object', () => {
      const result = formatTime(testDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats time from date string', () => {
      const result = formatTime('2024-03-15T14:30:00Z');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats time from timestamp', () => {
      const result = formatTime(testDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null date', () => {
      expect(formatTime(null)).toBe('—');
    });

    test('returns — for undefined date', () => {
      expect(formatTime(undefined)).toBe('—');
    });

    test('returns — for invalid date string', () => {
      expect(formatTime('invalid-date')).toBe('—');
    });

    test('accepts custom options', () => {
      const result = formatTime(testDate, { hour12: false });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatTime({});
      expect(result).toBe('—');
    });
  });

  describe('formatDateTime', () => {
    const testDate = new Date('2024-03-15T14:30:00Z');

    test('formats date and time together', () => {
      const result = formatDateTime(testDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toContain(' ');
    });

    test('formats from date string', () => {
      const result = formatDateTime('2024-03-15T14:30:00Z');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats from timestamp', () => {
      const result = formatDateTime(testDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null date', () => {
      expect(formatDateTime(null)).toBe('—');
    });

    test('returns — for undefined date', () => {
      expect(formatDateTime(undefined)).toBe('—');
    });

    test('returns — for invalid date string', () => {
      expect(formatDateTime('invalid-date')).toBe('—');
    });

    test('accepts custom date options', () => {
      const result = formatDateTime(testDate, { month: 'long' });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('accepts custom time options', () => {
      const result = formatDateTime(testDate, {}, { hour12: false });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatDateTime({});
      expect(result).toBe('—');
    });
  });

  describe('formatDateRange', () => {
    const fromDate = new Date('2024-03-15T10:00:00Z');
    const toDate = new Date('2024-03-20T10:00:00Z');

    test('formats date range with two Date objects', () => {
      const result = formatDateRange(fromDate, toDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toMatch(/—|\-/); // Contains separator
    });

    test('formats date range from date strings', () => {
      const result = formatDateRange('2024-03-15', '2024-03-20');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date range from timestamps', () => {
      const result = formatDateRange(fromDate.getTime(), toDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — when fromDate is null', () => {
      expect(formatDateRange(null, toDate)).toBe('—');
    });

    test('returns — when toDate is null', () => {
      expect(formatDateRange(fromDate, null)).toBe('—');
    });

    test('returns — when both dates are null', () => {
      expect(formatDateRange(null, null)).toBe('—');
    });

    test('returns — for invalid fromDate', () => {
      expect(formatDateRange('invalid', toDate)).toBe('—');
    });

    test('returns — for invalid toDate', () => {
      expect(formatDateRange(fromDate, 'invalid')).toBe('—');
    });

    test('uses Arabic separator for Arabic locale', () => {
      i18n.language = 'ar';
      const result = formatDateRange(fromDate, toDate);
      expect(result).toContain(' - ');
    });

    test('uses em dash separator for non-Arabic locales', () => {
      i18n.language = 'en';
      const result = formatDateRange(fromDate, toDate);
      expect(result).toContain(' — ');
    });

    test('accepts custom options', () => {
      const result = formatDateRange(fromDate, toDate, { month: 'long' });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatDateRange({}, {});
      expect(result).toBe('—');
    });
  });

  describe('formatTimeRange', () => {
    const fromDate = new Date('2024-03-15T10:00:00Z');
    const toDate = new Date('2024-03-15T14:00:00Z');

    test('formats time range with two Date objects', () => {
      const result = formatTimeRange(fromDate, toDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toMatch(/—|\-/); // Contains separator
    });

    test('formats time range from date strings', () => {
      const result = formatTimeRange(
        '2024-03-15T10:00:00Z',
        '2024-03-15T14:00:00Z'
      );
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats time range from timestamps', () => {
      const result = formatTimeRange(fromDate.getTime(), toDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — when fromDate is null', () => {
      expect(formatTimeRange(null, toDate)).toBe('—');
    });

    test('returns — when toDate is null', () => {
      expect(formatTimeRange(fromDate, null)).toBe('—');
    });

    test('returns — for invalid fromDate', () => {
      expect(formatTimeRange('invalid', toDate)).toBe('—');
    });

    test('returns — for invalid toDate', () => {
      expect(formatTimeRange(fromDate, 'invalid')).toBe('—');
    });

    test('uses Arabic separator for Arabic locale', () => {
      i18n.language = 'ar';
      const result = formatTimeRange(fromDate, toDate);
      expect(result).toContain(' - ');
    });

    test('uses em dash separator for non-Arabic locales', () => {
      i18n.language = 'en';
      const result = formatTimeRange(fromDate, toDate);
      expect(result).toContain(' — ');
    });

    test('accepts custom options', () => {
      const result = formatTimeRange(fromDate, toDate, { hour12: false });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatTimeRange({}, {});
      expect(result).toBe('—');
    });
  });

  describe('formatPickupTime', () => {
    test('formats pickup time with date, from, and to times', () => {
      const result = formatPickupTime('2024-03-15', '10:00', '14:00');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
      expect(result).toContain('—');
    });

    test('formats pickup date only when no time range provided', () => {
      const result = formatPickupTime('2024-03-15');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats with only pickupFrom time', () => {
      const result = formatPickupTime('2024-03-15', '10:00');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null pickupDate', () => {
      expect(formatPickupTime(null)).toBe('—');
    });

    test('returns — for undefined pickupDate', () => {
      expect(formatPickupTime(undefined)).toBe('—');
    });

    test('returns — for invalid date format', () => {
      expect(formatPickupTime('invalid-date')).toBe('—');
    });

    test('returns — for incomplete date (missing parts)', () => {
      expect(formatPickupTime('2024-03')).toBe('—');
    });

    test('handles invalid pickupFrom time gracefully', () => {
      const result = formatPickupTime('2024-03-15', 'invalid', '14:00');
      expect(result).toBeTruthy();
    });

    test('handles invalid pickupTo time gracefully', () => {
      const result = formatPickupTime('2024-03-15', '10:00', 'invalid');
      expect(result).toBeTruthy();
    });

    test('uses comma separator for non-Arabic locales', () => {
      i18n.language = 'en';
      const result = formatPickupTime('2024-03-15', '10:00', '14:00');
      expect(result).toContain(', ');
    });

    test('uses dash separator for Arabic locale', () => {
      i18n.language = 'ar';
      const result = formatPickupTime('2024-03-15', '10:00', '14:00');
      expect(result).toContain(' - ');
    });

    test('handles errors gracefully', () => {
      const result = formatPickupTime('2024-03-15', '10:00', '14:00');
      // Should not throw error
      expect(result).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    test('formats a number', () => {
      const result = formatNumber(1234.56);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats a number from string', () => {
      const result = formatNumber('1234.56');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats integer without decimal places', () => {
      const result = formatNumber(1234);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null', () => {
      expect(formatNumber(null)).toBe('—');
    });

    test('returns — for undefined', () => {
      expect(formatNumber(undefined)).toBe('—');
    });

    test('returns — for empty string', () => {
      expect(formatNumber('')).toBe('—');
    });

    test('returns — for invalid number string', () => {
      expect(formatNumber('not-a-number')).toBe('—');
    });

    test('formats zero', () => {
      const result = formatNumber(0);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats negative number', () => {
      const result = formatNumber(-1234.56);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('accepts custom options', () => {
      const result = formatNumber(1234.5678, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatNumber(Symbol('test'));
      expect(result).toBe('—');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('formatCurrency', () => {
    test('formats currency with default USD', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats currency from string', () => {
      const result = formatCurrency('1234.56');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats with custom currency', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats with CAD currency', () => {
      const result = formatCurrency(1234.56, 'CAD');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null amount', () => {
      expect(formatCurrency(null)).toBe('—');
    });

    test('returns — for undefined amount', () => {
      expect(formatCurrency(undefined)).toBe('—');
    });

    test('returns — for empty string', () => {
      expect(formatCurrency('')).toBe('—');
    });

    test('returns — for invalid amount string', () => {
      expect(formatCurrency('not-a-number')).toBe('—');
    });

    test('formats zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats negative amount', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('accepts custom options', () => {
      const result = formatCurrency(1234.56, 'USD', {
        minimumFractionDigits: 0,
      });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatCurrency(Symbol('test'));
      expect(result).toBe('—');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('formatPercentage', () => {
    test('formats decimal as percentage (0.5 = 50%)', () => {
      const result = formatPercentage(0.5);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats whole number as percentage (50 = 50%)', () => {
      const result = formatPercentage(50);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats percentage from string', () => {
      const result = formatPercentage('0.5');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats 100% correctly', () => {
      const result = formatPercentage(1);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats 0% correctly', () => {
      const result = formatPercentage(0);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null', () => {
      expect(formatPercentage(null)).toBe('—');
    });

    test('returns — for undefined', () => {
      expect(formatPercentage(undefined)).toBe('—');
    });

    test('returns — for empty string', () => {
      expect(formatPercentage('')).toBe('—');
    });

    test('returns — for invalid number string', () => {
      expect(formatPercentage('not-a-number')).toBe('—');
    });

    test('formats negative percentage', () => {
      const result = formatPercentage(-0.25);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats large percentage', () => {
      const result = formatPercentage(150);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('accepts custom options', () => {
      const result = formatPercentage(0.5, { maximumFractionDigits: 2 });
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('handles errors gracefully', () => {
      const result = formatPercentage(Symbol('test'));
      expect(result).toBe('—');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('formatRelativeTime', () => {
    test('formats date in the future (days)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const result = formatRelativeTime(futureDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the past (days)', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const result = formatRelativeTime(pastDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the future (hours)', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 5);
      const result = formatRelativeTime(futureDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the past (hours)', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 3);
      const result = formatRelativeTime(pastDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the future (minutes)', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      const result = formatRelativeTime(futureDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the past (minutes)', () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 15);
      const result = formatRelativeTime(pastDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the future (seconds)', () => {
      const futureDate = new Date();
      futureDate.setSeconds(futureDate.getSeconds() + 30);
      const result = formatRelativeTime(futureDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats date in the past (seconds)', () => {
      const pastDate = new Date();
      pastDate.setSeconds(pastDate.getSeconds() - 45);
      const result = formatRelativeTime(pastDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats from date string', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      const result = formatRelativeTime(pastDate.toISOString());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats from timestamp', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const result = formatRelativeTime(pastDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null date', () => {
      expect(formatRelativeTime(null)).toBe('—');
    });

    test('returns — for undefined date', () => {
      expect(formatRelativeTime(undefined)).toBe('—');
    });

    test('falls back to formatDate for invalid date', () => {
      const result = formatRelativeTime('invalid-date');
      expect(result).toBe('—');
    });

    test('handles errors gracefully and falls back to formatDate', () => {
      // Create a date object, but mock RelativeTimeFormat to throw
      const testDate = new Date();
      const originalRelativeTimeFormat = Intl.RelativeTimeFormat;
      Intl.RelativeTimeFormat = jest.fn(() => {
        throw new Error('Mock error');
      });

      const result = formatRelativeTime(testDate);
      expect(result).toBeTruthy();
      expect(console.error).toHaveBeenCalled();

      // Restore
      Intl.RelativeTimeFormat = originalRelativeTimeFormat;
    });
  });

  describe('formatExpiryDate', () => {
    const testDate = new Date('2024-03-15T10:30:00Z');

    test('formats expiry date', () => {
      const result = formatExpiryDate(testDate);
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats from date string', () => {
      const result = formatExpiryDate('2024-03-15');
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('formats from timestamp', () => {
      const result = formatExpiryDate(testDate.getTime());
      expect(result).toBeTruthy();
      expect(result).not.toBe('—');
    });

    test('returns — for null date', () => {
      expect(formatExpiryDate(null)).toBe('—');
    });

    test('returns — for invalid date', () => {
      expect(formatExpiryDate('invalid')).toBe('—');
    });
  });

  describe('getDateFormatPattern', () => {
    test('returns MM/DD/YYYY for US English', () => {
      i18n.language = 'en-US';
      expect(getDateFormatPattern()).toBe('MM/DD/YYYY');
    });

    test('returns DD/MM/YYYY for French', () => {
      i18n.language = 'fr';
      expect(getDateFormatPattern()).toBe('DD/MM/YYYY');
    });

    test('returns DD/MM/YYYY for Spanish', () => {
      i18n.language = 'es';
      expect(getDateFormatPattern()).toBe('DD/MM/YYYY');
    });

    test('returns YYYY-MM-DD for Chinese', () => {
      i18n.language = 'zh';
      expect(getDateFormatPattern()).toBe('YYYY-MM-DD');
    });

    test('returns DD/MM/YYYY for Arabic', () => {
      i18n.language = 'ar';
      expect(getDateFormatPattern()).toBe('DD/MM/YYYY');
    });

    test('returns DD/MM/YYYY for Portuguese', () => {
      i18n.language = 'pt';
      expect(getDateFormatPattern()).toBe('DD/MM/YYYY');
    });

    test('returns MM/DD/YYYY for unknown locale', () => {
      i18n.language = 'unknown';
      expect(getDateFormatPattern()).toBe('MM/DD/YYYY');
    });
  });

  describe('getNumberFormatInfo', () => {
    test('returns object with decimal and group separators', () => {
      const result = getNumberFormatInfo();
      expect(result).toHaveProperty('decimal');
      expect(result).toHaveProperty('group');
      expect(typeof result.decimal).toBe('string');
      expect(typeof result.group).toBe('string');
    });

    test('returns correct separators for US English', () => {
      i18n.language = 'en-US';
      const result = getNumberFormatInfo();
      expect(result.decimal).toBe('.');
      expect(result.group).toBe(',');
    });

    test('returns separators for French locale', () => {
      i18n.language = 'fr';
      const result = getNumberFormatInfo();
      expect(result).toHaveProperty('decimal');
      expect(result).toHaveProperty('group');
    });

    test('returns separators for different locales', () => {
      const locales = ['en', 'fr', 'es', 'zh', 'ar', 'pt'];
      locales.forEach(lang => {
        i18n.language = lang;
        const result = getNumberFormatInfo();
        expect(result).toHaveProperty('decimal');
        expect(result).toHaveProperty('group');
      });
    });
  });
});
