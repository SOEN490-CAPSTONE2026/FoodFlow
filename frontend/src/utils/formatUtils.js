import i18n from '../locales/i18n';

/**
 * Maps i18n language codes to proper locale codes for date/number formatting
 * Language codes: en, fr, es, zh, ar, pt
 */
const LOCALE_MAP = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  zh: 'zh-CN',
  ar: 'ar-SA',
  pt: 'pt-BR',
};

/**
 * Get the current locale code based on i18n language
 * @returns {string} Locale code (e.g., 'en-US', 'fr-FR')
 */
export const getCurrentLocale = () => {
  const lang = i18n.language?.split('-')[0] || 'en';
  return LOCALE_MAP[lang] || LOCALE_MAP.en;
};

/**
 * Format a date according to the current locale
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) {
    return '—';
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const locale = getCurrentLocale();
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return dateObj.toLocaleDateString(locale, {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
};

/**
 * Format a time according to the current locale
 * @param {Date|string|number} date - Date to extract time from
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export const formatTime = (date, options = {}) => {
  if (!date) {
    return '—';
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const locale = getCurrentLocale();
    const defaultOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    return dateObj.toLocaleTimeString(locale, {
      ...defaultOptions,
      ...options,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '—';
  }
};

/**
 * Format a date and time together according to the current locale
 * @param {Date|string|number} date - Date to format
 * @param {Object} dateOptions - Intl.DateTimeFormat options for date
 * @param {Object} timeOptions - Intl.DateTimeFormat options for time
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, dateOptions = {}, timeOptions = {}) => {
  if (!date) {
    return '—';
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const locale = getCurrentLocale();
    const dateStr = formatDate(dateObj, dateOptions);
    const timeStr = formatTime(dateObj, timeOptions);

    return `${dateStr} ${timeStr}`;
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return '—';
  }
};

/**
 * Format a date range (from date to date) according to the current locale
 * @param {Date|string|number} fromDate - Start date
 * @param {Date|string|number} toDate - End date
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date range string
 */
export const formatDateRange = (fromDate, toDate, options = {}) => {
  if (!fromDate || !toDate) {
    return '—';
  }

  try {
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const to = toDate instanceof Date ? toDate : new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return '—';
    }

    const locale = getCurrentLocale();
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    const fromStr = from.toLocaleDateString(locale, {
      ...defaultOptions,
      ...options,
    });
    const toStr = to.toLocaleDateString(locale, {
      ...defaultOptions,
      ...options,
    });

    const separator = locale.startsWith('ar') ? ' - ' : ' — ';
    return `${fromStr}${separator}${toStr}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '—';
  }
};

/**
 * Format a time range (from time to time) according to the current locale
 * @param {Date|string|number} fromDate - Start date/time
 * @param {Date|string|number} toDate - End date/time
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time range string
 */
export const formatTimeRange = (fromDate, toDate, options = {}) => {
  if (!fromDate || !toDate) {
    return '—';
  }

  try {
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const to = toDate instanceof Date ? toDate : new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return '—';
    }

    const fromStr = formatTime(from, options);
    const toStr = formatTime(to, options);

    const locale = getCurrentLocale();
    const separator = locale.startsWith('ar') ? ' - ' : ' — ';
    return `${fromStr}${separator}${toStr}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return '—';
  }
};

/**
 * Format pickup time from date string and time strings (HH:MM format)
 * Useful for formatting pickup slots in the application
 * @param {string} pickupDate - Date string in YYYY-MM-DD format
 * @param {string} pickupFrom - Time string in HH:MM format (24-hour)
 * @param {string} pickupTo - Time string in HH:MM format (24-hour)
 * @returns {string} Formatted pickup time string
 */
export const formatPickupTime = (pickupDate, pickupFrom, pickupTo) => {
  if (!pickupDate) {
    return '—';
  }

  try {
    const [year, month, day] = pickupDate.split('-').map(Number);
    if (!year || !month || !day) {
      return '—';
    }

    const date = new Date(year, month - 1, day);
    const locale = getCurrentLocale();

    const dateStr = date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (pickupFrom && pickupTo) {
      const [fromHours, fromMinutes] = pickupFrom.split(':').map(Number);
      const [toHours, toMinutes] = pickupTo.split(':').map(Number);

      if (
        !isNaN(fromHours) &&
        !isNaN(fromMinutes) &&
        !isNaN(toHours) &&
        !isNaN(toMinutes)
      ) {
        const fromDate = new Date(year, month - 1, day, fromHours, fromMinutes);
        const toDate = new Date(year, month - 1, day, toHours, toMinutes);

        const fromStr = fromDate.toLocaleTimeString(locale, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const toStr = toDate.toLocaleTimeString(locale, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const separator = locale.startsWith('ar') ? ' - ' : ', ';
        return `${dateStr}${separator}${fromStr} — ${toStr}`;
      }
    }

    return dateStr;
  } catch (error) {
    console.error('Error formatting pickup time:', error);
    return '—';
  }
};

/**
 * Format a number according to the current locale
 * @param {number|string} number - Number to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined || number === '') {
    return '—';
  }

  try {
    const num = typeof number === 'string' ? parseFloat(number) : number;
    if (isNaN(num)) {
      return '—';
    }

    const locale = getCurrentLocale();
    const defaultOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    return new Intl.NumberFormat(locale, {
      ...defaultOptions,
      ...options,
    }).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '—';
  }
};

/**
 * Format a number as currency according to the current locale
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', options = {}) => {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
      return '—';
    }

    const locale = getCurrentLocale();
    const defaultOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    return new Intl.NumberFormat(locale, {
      ...defaultOptions,
      ...options,
    }).format(num);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '—';
  }
};

/**
 * Format a number as a percentage according to the current locale
 * @param {number|string} number - Number to format (0-1 or 0-100)
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (number, options = {}) => {
  if (number === null || number === undefined || number === '') {
    return '—';
  }

  try {
    const num = typeof number === 'string' ? parseFloat(number) : number;
    if (isNaN(num)) {
      return '—';
    }

    // If number is between 0 and 1, assume it's a decimal (0.5 = 50%)
    // Otherwise, assume it's already a percentage (50 = 50%)
    const percentage = num <= 1 && num >= -1 ? num * 100 : num;

    const locale = getCurrentLocale();
    const defaultOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    };

    return new Intl.NumberFormat(locale, {
      ...defaultOptions,
      ...options,
    }).format(percentage / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '—';
  }
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days") according to the current locale
 * Uses a simple implementation. For more complex relative time formatting,
 * consider using a library like date-fns or moment.js
 * @param {Date|string|number} date - Date to format relatively
 * @returns {string} Relative time string
 */
export const formatRelativeTime = date => {
  if (!date) {
    return '—';
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    const now = new Date();
    const diffInMs = dateObj - now;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    const locale = getCurrentLocale();

    if (Math.abs(diffInDays) >= 1) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        diffInDays,
        'day'
      );
    } else if (Math.abs(diffInHours) >= 1) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        diffInHours,
        'hour'
      );
    } else if (Math.abs(diffInMinutes) >= 1) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        diffInMinutes,
        'minute'
      );
    } else {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        diffInSeconds,
        'second'
      );
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return formatDate(date);
  }
};

/**
 * Format expiry date (short format, commonly used in the app)
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted expiry date string
 */
export const formatExpiryDate = date => {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get locale-specific date format pattern
 * Useful for configuring date pickers
 * @returns {string} Date format pattern (e.g., 'MM/DD/YYYY' for US, 'DD/MM/YYYY' for FR)
 */
export const getDateFormatPattern = () => {
  const locale = getCurrentLocale();

  const patterns = {
    'en-US': 'MM/DD/YYYY',
    'fr-FR': 'DD/MM/YYYY',
    'es-ES': 'DD/MM/YYYY',
    'zh-CN': 'YYYY-MM-DD',
    'ar-SA': 'DD/MM/YYYY',
    'pt-BR': 'DD/MM/YYYY',
  };

  return patterns[locale] || patterns['en-US'];
};

/**
 * Get locale-specific number format information
 * @returns {Object} Object with decimal separator and thousands separator
 */
export const getNumberFormatInfo = () => {
  const locale = getCurrentLocale();

  const sample = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const formatted = sample.formatToParts(1234.5);

  const info = {
    decimal: '.',
    group: ',',
  };

  formatted.forEach(part => {
    if (part.type === 'decimal') {
      info.decimal = part.value;
    } else if (part.type === 'group') {
      info.group = part.value;
    }
  });

  return info;
};
