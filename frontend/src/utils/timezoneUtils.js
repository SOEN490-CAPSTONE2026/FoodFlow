/**
 * Utility functions for timezone-aware date/time formatting
 */

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
    // Backend sends LocalDateTime in UTC, but without timezone info
    // JavaScript will parse it as local time, so we need to add 'Z' to indicate UTC
    let dateStr = timestamp;
    if (
      typeof timestamp === 'string' &&
      !timestamp.endsWith('Z') &&
      !timestamp.includes('+')
    ) {
      dateStr = timestamp + 'Z';
    }
    const date = new Date(dateStr);
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
    const date = new Date(timestamp);
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
