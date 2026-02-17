import { computeSuggestedExpiry } from '../expiryRules';

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
});
