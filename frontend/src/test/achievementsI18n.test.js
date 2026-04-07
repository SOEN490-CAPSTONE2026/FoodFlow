import { translateAchievement } from '../utils/achievementsI18n';

describe('translateAchievement', () => {
  let t;

  beforeEach(() => {
    t = jest.fn((key, optionsOrFallback) => {
      if (typeof optionsOrFallback === 'string') {
        return optionsOrFallback;
      }
      if (optionsOrFallback && typeof optionsOrFallback === 'object') {
        return optionsOrFallback.defaultValue ?? key;
      }
      return key;
    });
  });

  it('returns input when achievement is missing', () => {
    expect(translateAchievement(t, null)).toBeNull();
    expect(translateAchievement(t, undefined)).toBeUndefined();
  });

  it('covers all description template criteria branches', () => {
    const criteriaTypes = [
      'DONATION_COUNT',
      'WEEKLY_STREAK',
      'MESSAGE_COUNT',
      'UNIQUE_PARTNER_COUNT',
    ];

    criteriaTypes.forEach(criteriaType => {
      const translated = translateAchievement(t, {
        name: 'First Impact',
        description: 'Default description',
        criteriaType,
        criteriaValue: 3,
      });

      expect(translated.name).toBe('First Impact');
      expect(translated.description).toBe('Default description');
    });
  });

  it('falls back to original description for unknown criteria type', () => {
    const translated = translateAchievement(t, {
      name: 'Special Badge',
      description: 'Keep this',
      criteriaType: 'UNKNOWN_TYPE',
    });

    expect(translated.description).toBe('Keep this');
  });
});
