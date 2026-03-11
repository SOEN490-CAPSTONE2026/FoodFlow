import {
  areDifferentDaysInTimezone,
  formatDateInTimezone,
  formatPickupWindowFromParts,
  formatTimeInTimezone,
  formatWallClockDate,
  formatWallClockTime,
  getDateSeparatorInTimezone,
  parseExplicitUtcTimestamp,
  parseBackendUtcDateTimeParts,
  parseBackendUtcTimestamp,
  parseLocalDateTimeParts,
  toLocalDateInputValue,
} from '../timezoneUtils';

describe('timezoneUtils', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty string when timestamp is missing', () => {
    expect(formatTimeInTimezone(null)).toBe('');
    expect(formatDateInTimezone(undefined)).toBe('');
    expect(getDateSeparatorInTimezone('')).toBe('');
  });

  it('formats UTC time and appends Z for naive timestamp strings', () => {
    const result = formatTimeInTimezone('2026-02-18T12:30:00', 'UTC');
    expect(result).toMatch(/12:30/);
  });

  it('formats full date in timezone', () => {
    const result = formatDateInTimezone('2026-02-18T12:30:00Z', 'UTC');
    expect(result).toMatch(/February/);
    expect(result).toMatch(/2026/);
  });

  it('returns Today and Yesterday separators', () => {
    const now = new Date();
    const todayIso = now.toISOString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    expect(getDateSeparatorInTimezone(todayIso, 'UTC')).toBe('Today');
    expect(getDateSeparatorInTimezone(yesterday.toISOString(), 'UTC')).toBe(
      'Yesterday'
    );
  });

  it('falls back to date formatting for older dates', () => {
    const older = '2020-01-01T00:00:00Z';
    const result = getDateSeparatorInTimezone(older, 'UTC');

    expect(result).toMatch(/2020/);
  });

  it('detects same/different day correctly', () => {
    expect(
      areDifferentDaysInTimezone(
        '2026-02-18T00:01:00Z',
        '2026-02-18T23:59:59Z',
        'UTC'
      )
    ).toBe(false);

    expect(
      areDifferentDaysInTimezone(
        '2026-02-18T23:59:59Z',
        '2026-02-19T00:00:00Z',
        'UTC'
      )
    ).toBe(true);
  });

  it('returns true when one timestamp is missing', () => {
    expect(areDifferentDaysInTimezone(null, '2026-02-18T23:59:59Z')).toBe(true);
  });

  it('uses fallback branch when formatter throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const toLocaleSpy = jest
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementationOnce(() => {
        throw new Error('format failed');
      })
      .mockImplementation(() => '12:00 PM');

    expect(formatTimeInTimezone('2026-02-18T12:00:00Z', 'UTC')).toBe(
      '12:00 PM'
    );
    expect(consoleErrorSpy).toHaveBeenCalled();

    toLocaleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('uses fallback branch in formatDateInTimezone when formatter throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const toLocaleSpy = jest
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementationOnce(() => {
        throw new Error('date formatter failed');
      })
      .mockImplementation(() => 'February 18, 2026');

    expect(formatDateInTimezone('2026-02-18T12:00:00Z', 'UTC')).toBe(
      'February 18, 2026'
    );
    expect(consoleErrorSpy).toHaveBeenCalled();

    toLocaleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('uses fallback branch in getDateSeparatorInTimezone when conversion throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const localeSpy = jest
      .spyOn(Date.prototype, 'toLocaleString')
      .mockImplementationOnce(() => {
        throw new Error('timezone conversion failed');
      });

    const result = getDateSeparatorInTimezone('2026-02-18T12:00:00Z', 'UTC');
    expect(result).toMatch(/2026/);
    expect(consoleErrorSpy).toHaveBeenCalled();

    localeSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('returns true in areDifferentDaysInTimezone when conversion throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const localeSpy = jest
      .spyOn(Date.prototype, 'toLocaleString')
      .mockImplementationOnce(() => {
        throw new Error('timezone compare failed');
      });

    expect(
      areDifferentDaysInTimezone(
        '2026-02-18T12:00:00Z',
        '2026-02-18T13:00:00Z',
        'UTC'
      )
    ).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();

    localeSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('toLocalDateInputValue preserves local calendar day for date-only payloads', () => {
    const localDate = new Date(2026, 2, 10, 9, 30, 0);
    expect(toLocalDateInputValue(localDate)).toBe('2026-03-10');
  });

  it('parseBackendUtcTimestamp treats naive backend datetime as UTC', () => {
    const parsed = parseBackendUtcTimestamp('2026-03-10T12:34:56');
    expect(parsed).not.toBeNull();
    expect(parsed.getTime()).toBe(Date.UTC(2026, 2, 10, 12, 34, 56));
  });

  it('parseExplicitUtcTimestamp parses explicit UTC contract timestamps', () => {
    const parsed = parseExplicitUtcTimestamp('2026-03-10T12:34:56Z');
    expect(parsed).not.toBeNull();
    expect(parsed.getTime()).toBe(Date.UTC(2026, 2, 10, 12, 34, 56));
  });

  it('parseExplicitUtcTimestamp does not infer timezone for naive timestamps', () => {
    expect(parseExplicitUtcTimestamp('2026-03-10T12:34:56')).toBeNull();
  });

  it('parseBackendUtcDateTimeParts builds UTC instant from date+time parts', () => {
    const parsed = parseBackendUtcDateTimeParts('2026-03-10', '08:15:00');
    expect(parsed).not.toBeNull();
    expect(parsed.getTime()).toBe(Date.UTC(2026, 2, 10, 8, 15, 0));
  });

  it('parseLocalDateTimeParts keeps local wall-clock date/time', () => {
    const parsed = parseLocalDateTimeParts('2026-03-10', '08:15:00');
    expect(parsed).not.toBeNull();
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(10);
    expect(parsed.getHours()).toBe(8);
    expect(parsed.getMinutes()).toBe(15);
  });

  it('formatWallClockDate formats date part without timezone drift', () => {
    expect(formatWallClockDate('2026-03-10')).toBe('Mar 10, 2026');
  });

  it('formatWallClockTime formats time part as wall-clock time', () => {
    expect(formatWallClockTime('13:05:00')).toBe('1:05 PM');
  });

  it('formatPickupWindowFromParts combines wall-clock pickup values', () => {
    expect(
      formatPickupWindowFromParts('2026-03-10', '09:15:00', '17:45:00')
    ).toBe('Mar 10, 2026 9:15 AM-5:45 PM');
  });

  it('invalid inputs return null/empty safe fallbacks', () => {
    expect(parseBackendUtcTimestamp('not-a-date')).toBeNull();
    expect(parseBackendUtcDateTimeParts(null, '10:00:00')).toBeNull();
    expect(toLocalDateInputValue(null)).toBe('');
  });
});
