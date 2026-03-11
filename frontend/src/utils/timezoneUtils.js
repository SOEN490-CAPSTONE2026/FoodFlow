/**
 * Utility functions for timezone-aware date/time formatting
 */

/**
 * Format a Date into YYYY-MM-DD using local calendar fields.
 * This avoids UTC day-shift bugs from toISOString() for date-only payloads.
 */
export const toLocalDateInputValue = value => {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse backend LocalDateTime-like values as UTC when no offset is provided.
 */
export const parseBackendUtcTimestamp = timestamp => {
  if (!timestamp) {
    return null;
  }
  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }
  if (typeof timestamp !== 'string') {
    return null;
  }

  const normalized =
    !timestamp.endsWith('Z') && !timestamp.includes('+')
      ? `${timestamp}Z`
      : timestamp;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Parse API timestamps that explicitly include timezone/offset (preferred contract).
 */
export const parseExplicitUtcTimestamp = timestamp => {
  if (!timestamp) {
    return null;
  }
  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }
  if (typeof timestamp !== 'string') {
    return null;
  }

  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp);
  if (!hasOffset) {
    return null;
  }
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Parse backend pickup date/time parts as UTC.
 */
export const parseBackendUtcDateTimeParts = (datePart, timePart) => {
  if (!datePart || !timePart) {
    return null;
  }
  return parseBackendUtcTimestamp(`${datePart}T${timePart}`);
};

/**
 * Parse date/time parts as local wall-clock values (no timezone conversion).
 * Use this when the backend already returned values converted for the user.
 */
export const parseLocalDateTimeParts = (datePart, timePart) => {
  if (!datePart || !timePart) {
    return null;
  }

  if (typeof datePart !== 'string' || typeof timePart !== 'string') {
    return null;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Format date part (YYYY-MM-DD) as a calendar date without browser timezone shifts.
 */
export const formatWallClockDate = (datePart, locale = 'en-US') => {
  if (!datePart || typeof datePart !== 'string') {
    return '';
  }
  const [year, month, day] = datePart.split('-').map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return '';
  }

  const stableDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(stableDate.getTime())) {
    return '';
  }

  return stableDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Format time part (HH:mm[:ss]) as a wall-clock time without timezone shifts.
 */
export const formatWallClockTime = (timePart, locale = 'en-US') => {
  if (!timePart || typeof timePart !== 'string') {
    return '';
  }
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return '';
  }

  const stableTime = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
  if (Number.isNaN(stableTime.getTime())) {
    return '';
  }

  return stableTime
    .toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    })
    .replace(/\u00A0|\u202F/g, ' ');
};

/**
 * Format a pickup window from backend date/time parts that are already in target timezone.
 */
export const formatPickupWindowFromParts = (
  pickupDate,
  pickupFrom,
  pickupTo,
  locale = 'en-US'
) => {
  const dateLabel = formatWallClockDate(String(pickupDate), locale);
  const fromLabel = formatWallClockTime(String(pickupFrom), locale);
  const toLabel = formatWallClockTime(String(pickupTo), locale);
  if (!dateLabel || !fromLabel || !toLabel) {
    return '';
  }
  return `${dateLabel} ${fromLabel}-${toLabel}`;
};

/**
 * Format a UTC timestamp to the user's timezone
 * @param {string|Date} timestamp - UTC timestamp
 * @param {string} userTimezone - IANA timezone identifier (e.g., "America/Toronto")
 * @returns {string} Formatted time string
 */
export const formatTimeInTimezone = (timestamp, userTimezone = 'UTC') => {
  if (!timestamp) {
    return '';
  }

  try {
    const date = parseBackendUtcTimestamp(timestamp);
    if (!date) {
      return '';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting time:', error);
    // Fallback - just parse normally
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
};

/**
 * Format a UTC timestamp to a full date in the user's timezone
 * @param {string|Date} timestamp - UTC timestamp
 * @param {string} userTimezone - IANA timezone identifier
 * @returns {string} Formatted date string
 */
export const formatDateInTimezone = (timestamp, userTimezone = 'UTC') => {
  if (!timestamp) {
    return '';
  }

  try {
    const date = parseBackendUtcTimestamp(timestamp);
    if (!date) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: userTimezone,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting date:', error);
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
};

/**
 * Get date separator text (Today, Yesterday, or full date)
 * @param {string|Date} timestamp - UTC timestamp
 * @param {string} userTimezone - IANA timezone identifier
 * @returns {string} Date separator text
 */
export const getDateSeparatorInTimezone = (timestamp, userTimezone = 'UTC') => {
  if (!timestamp) {
    return '';
  }

  try {
    const messageDate = new Date(timestamp);

    // Get today and yesterday in user's timezone
    const nowInUserTz = new Date(
      new Date().toLocaleString('en-US', { timeZone: userTimezone })
    );
    const todayInUserTz = new Date(nowInUserTz);
    todayInUserTz.setHours(0, 0, 0, 0);

    const yesterdayInUserTz = new Date(todayInUserTz);
    yesterdayInUserTz.setDate(yesterdayInUserTz.getDate() - 1);

    // Get message date in user's timezone
    const messageDateInUserTz = new Date(
      messageDate.toLocaleString('en-US', { timeZone: userTimezone })
    );
    messageDateInUserTz.setHours(0, 0, 0, 0);

    if (messageDateInUserTz.getTime() === todayInUserTz.getTime()) {
      return 'Today';
    } else if (messageDateInUserTz.getTime() === yesterdayInUserTz.getTime()) {
      return 'Yesterday';
    } else {
      return formatDateInTimezone(timestamp, userTimezone);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting date separator:', error);
    return formatDateInTimezone(timestamp, userTimezone);
  }
};

/**
 * Check if two timestamps are on different days in the user's timezone
 * @param {string|Date} timestamp1 - First UTC timestamp
 * @param {string|Date} timestamp2 - Second UTC timestamp
 * @param {string} userTimezone - IANA timezone identifier
 * @returns {boolean} True if timestamps are on different days
 */
export const areDifferentDaysInTimezone = (
  timestamp1,
  timestamp2,
  userTimezone = 'UTC'
) => {
  if (!timestamp1 || !timestamp2) {
    return true;
  }

  try {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    const date1InUserTz = new Date(
      date1.toLocaleString('en-US', { timeZone: userTimezone })
    );
    const date2InUserTz = new Date(
      date2.toLocaleString('en-US', { timeZone: userTimezone })
    );

    date1InUserTz.setHours(0, 0, 0, 0);
    date2InUserTz.setHours(0, 0, 0, 0);

    return date1InUserTz.getTime() !== date2InUserTz.getTime();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error comparing dates:', error);
    return true;
  }
};
