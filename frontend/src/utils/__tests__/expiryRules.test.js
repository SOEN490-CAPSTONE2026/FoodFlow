import {
  computeSuggestedExpiry,
  addDays,
  formatDateYYYYMMDD,
} from '../expiryRules';

describe('addDays', () => {
  test('adds days correctly', () => {
    const date = new Date(2026, 1, 17); // February 17, 2026
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(22);
  });
});

describe('formatDateYYYYMMDD', () => {
  test('formats date correctly', () => {
    const date = new Date(2026, 1, 17); // February 17, 2026
    expect(formatDateYYYYMMDD(date)).toBe('2026-02-17');
  });

  test('returns null for invalid date', () => {
    expect(formatDateYYYYMMDD(new Date('invalid'))).toBe(null);
  });

  test('returns null for non-date', () => {
    expect(formatDateYYYYMMDD('not a date')).toBe(null);
  });
});

describe('computeSuggestedExpiry', () => {
  test('PREPARED + REFRIGERATED adds 3 days and is eligible', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PREPARED',
      temperatureCategory: 'REFRIGERATED',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.suggestedExpiryDate).toBe('2026-02-20');
    expect(result.eligible).toBe(true);
  });

  test('PREPARED + ROOM_TEMPERATURE is same day and not eligible', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PREPARED',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.suggestedExpiryDate).toBe('2026-02-17');
    expect(result.eligible).toBe(false);
  });

  test('DAIRY_EGGS + ROOM_TEMPERATURE is not eligible', () => {
    const result = computeSuggestedExpiry({
      foodType: 'DAIRY_EGGS',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.eligible).toBe(false);
  });

  test('MEAT_POULTRY + HOT_COOKED is not eligible', () => {
    const result = computeSuggestedExpiry({
      foodType: 'MEAT_POULTRY',
      temperatureCategory: 'HOT_COOKED',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.eligible).toBe(false);
  });

  test('SEAFOOD + ROOM_TEMPERATURE is not eligible', () => {
    const result = computeSuggestedExpiry({
      foodType: 'SEAFOOD',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.eligible).toBe(false);
  });

  test('PANTRY + ROOM_TEMPERATURE adds 30 days', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PANTRY',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'BOXED',
      fabricationDate: '2026-02-17',
    });

    expect(result.suggestedExpiryDate).toBe('2026-03-19');
    expect(result.eligible).toBe(true);
  });

  test('packaging mismatch warning for refrigerated container at room temp', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PRODUCE',
      temperatureCategory: 'ROOM_TEMPERATURE',
      packagingType: 'REFRIGERATED_CONTAINER',
      fabricationDate: '2026-02-17',
    });

    expect(result.warnings).toContain(
      'Packaging suggests cold storage, confirm temperature'
    );
  });

  test('frozen container with non-frozen temperature shows warning', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PRODUCE',
      temperatureCategory: 'REFRIGERATED',
      packagingType: 'FROZEN_CONTAINER',
      fabricationDate: '2026-02-17',
    });

    expect(result.warnings).toContain(
      'Packaging suggests frozen storage, confirm temperature'
    );
  });

  test('PRODUCE + HOT_COOKED shows warning', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PRODUCE',
      temperatureCategory: 'HOT_COOKED',
      packagingType: 'OTHER',
      fabricationDate: '2026-02-17',
    });

    expect(result.warnings).toContain('Produce is usually not hot/cooked');
  });

  test('PANTRY + HOT_COOKED shows warning', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PANTRY',
      temperatureCategory: 'HOT_COOKED',
      packagingType: 'OTHER',
      fabricationDate: '2026-02-17',
    });

    expect(result.warnings).toContain(
      'Pantry items are usually stored at room temperature'
    );
  });

  test('BEVERAGES + HOT_COOKED shows warning', () => {
    const result = computeSuggestedExpiry({
      foodType: 'BEVERAGES',
      temperatureCategory: 'HOT_COOKED',
      packagingType: 'OTHER',
      fabricationDate: '2026-02-17',
    });

    expect(result.warnings).toContain('Hot beverages are same-day donations');
  });

  test('PREPARED + HOT_COOKED is same day, eligible, with warning', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PREPARED',
      temperatureCategory: 'HOT_COOKED',
      packagingType: 'OTHER',
      fabricationDate: '2026-02-17',
    });

    expect(result.suggestedExpiryDate).toBe('2026-02-17');
    expect(result.eligible).toBe(true);
    expect(result.warnings).toContain(
      'Hot food must be cooled and refrigerated to be eligible for donation'
    );
  });

  test('returns null suggestedExpiryDate when no fabricationDate provided', () => {
    const result = computeSuggestedExpiry({
      foodType: 'PREPARED',
      temperatureCategory: 'REFRIGERATED',
      packagingType: 'SEALED',
    });

    expect(result.suggestedExpiryDate).toBe(null);
    expect(result.explanation).toBe(null);
  });

  test('returns null when foodType is missing', () => {
    const result = computeSuggestedExpiry({
      temperatureCategory: 'REFRIGERATED',
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.suggestedExpiryDate).toBe(null);
  });

  test('eligible is true when foodType and temperatureCategory are missing', () => {
    const result = computeSuggestedExpiry({
      packagingType: 'SEALED',
      fabricationDate: '2026-02-17',
    });

    expect(result.eligible).toBe(true);
  });
});
