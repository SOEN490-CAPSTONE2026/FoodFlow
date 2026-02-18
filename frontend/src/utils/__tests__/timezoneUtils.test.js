import {
  formatTimeInTimezone,
  formatDateInTimezone,
  getDateSeparatorInTimezone,
  areDifferentDaysInTimezone,
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
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const toLocaleSpy = jest
      .spyOn(Date.prototype, 'toLocaleTimeString')
      .mockImplementationOnce(() => {
        throw new Error('format failed');
      })
      .mockImplementation(() => '12:00 PM');

    expect(formatTimeInTimezone('2026-02-18T12:00:00Z', 'UTC')).toBe('12:00 PM');
    expect(consoleErrorSpy).toHaveBeenCalled();

    toLocaleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
