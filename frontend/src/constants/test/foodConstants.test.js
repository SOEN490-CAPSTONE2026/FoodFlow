import {
  foodTypeOptions,
  unitOptions,
  getFoodTypeLabel,
  getUnitLabel,
  getFoodTypeValue,
  foodTypeImages,
  foodTypeClasses,
  getFoodCategoryDisplays,
  getPrimaryFoodCategory,
  getFoodImageClass,
  mapLegacyCategoryToFoodType,
  mapFoodTypeToLegacyCategory,
} from '../foodConstants';

describe('foodConstants', () => {
  describe('foodTypeOptions', () => {
    test('should be an array with correct structure', () => {
      expect(Array.isArray(foodTypeOptions)).toBe(true);
      expect(foodTypeOptions.length).toBeGreaterThan(0);

      foodTypeOptions.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    test('should contain expected food type options', () => {
      const expectedOptions = [
        { value: 'PREPARED', label: 'Prepared Meals' },
        { value: 'PRODUCE', label: 'Produce' },
        { value: 'BAKERY', label: 'Bakery & Pastry' },
        { value: 'DAIRY_EGGS', label: 'Dairy & Eggs' },
        { value: 'MEAT_POULTRY', label: 'Meat & Poultry' },
        { value: 'SEAFOOD', label: 'Seafood' },
        { value: 'PANTRY', label: 'Packaged / Pantry Items' },
        { value: 'BEVERAGES', label: 'Beverages' },
      ];

      expectedOptions.forEach(expectedOption => {
        expect(foodTypeOptions).toContainEqual(expectedOption);
      });
    });
  });

  describe('unitOptions', () => {
    test('should contain expected unit options', () => {
      const expectedOptions = [
        { value: 'KILOGRAM', label: 'kg' },
        { value: 'ITEM', label: 'items' },
        { value: 'LITER', label: 'liters' },
        { value: 'POUND', label: 'lbs' },
        { value: 'BOX', label: 'boxes' },
      ];

      expectedOptions.forEach(expectedOption => {
        expect(unitOptions).toContainEqual(expectedOption);
      });
    });
  });

  describe('food type mapping helpers', () => {
    test('should return correct labels for current enum values', () => {
      expect(getFoodTypeLabel('PREPARED')).toBe('Prepared Meals');
      expect(getFoodTypeLabel('PRODUCE')).toBe('Produce');
      expect(getFoodTypeLabel('PANTRY')).toBe('Packaged / Pantry Items');
    });

    test('should support legacy enum values', () => {
      expect(getFoodTypeLabel('PREPARED_MEALS')).toBe('Prepared Meals');
      expect(getFoodTypeLabel('FRUITS_VEGETABLES')).toBe('Produce');
      expect(getFoodTypeLabel('DAIRY_COLD')).toBe('Dairy & Eggs');
    });

    test('should map label to enum value', () => {
      expect(getFoodTypeValue('Prepared Meals')).toBe('PREPARED');
      expect(getFoodTypeValue('Produce')).toBe('PRODUCE');
      expect(getFoodTypeValue('Dairy & Eggs')).toBe('DAIRY_EGGS');
    });

    test('legacy-to-new mapper works', () => {
      expect(mapLegacyCategoryToFoodType('FRUITS_VEGETABLES')).toBe('PRODUCE');
      expect(mapLegacyCategoryToFoodType('PREPARED_MEALS')).toBe('PREPARED');
    });

    test('new-to-legacy mapper works', () => {
      expect(mapFoodTypeToLegacyCategory('PRODUCE')).toBe('FRUITS_VEGETABLES');
      expect(mapFoodTypeToLegacyCategory('PREPARED')).toBe('PREPARED_MEALS');
    });
  });

  describe('category display helpers', () => {
    test('should return display labels for categories', () => {
      const result = getFoodCategoryDisplays(['FRUITS_VEGETABLES', 'BAKERY']);
      expect(result).toEqual(['Produce', 'Bakery & Pastry']);
    });

    test('should return primary display label', () => {
      const result = getPrimaryFoodCategory(['FRUITS_VEGETABLES', 'BAKERY']);
      expect(result).toBe('Produce');
    });

    test('should return Other for empty input', () => {
      expect(getFoodCategoryDisplays([])).toEqual(['Other']);
      expect(getPrimaryFoodCategory([])).toBe('Other');
    });
  });

  describe('images and css classes', () => {
    test('all current food type labels should have image and css class entries', () => {
      foodTypeOptions.forEach(option => {
        expect(foodTypeImages).toHaveProperty(option.label);
        expect(foodTypeClasses).toHaveProperty(option.label);
      });
    });

    test('should return expected class names for known labels', () => {
      expect(getFoodImageClass('Bakery & Pastry')).toBe('food-image-bakery');
      expect(getFoodImageClass('Produce')).toBe('food-image-fruits-veg');
      expect(getFoodImageClass('Prepared Meals')).toBe('food-image-prepared');
    });

    test('should return fallback class for unknown labels', () => {
      expect(getFoodImageClass('Unknown')).toBe('food-image-packaged');
      expect(getFoodImageClass(undefined)).toBe('food-image-packaged');
    });
  });

  describe('getUnitLabel', () => {
    test('should return correct labels for valid units', () => {
      expect(getUnitLabel('KILOGRAM')).toBe('kg');
      expect(getUnitLabel('ITEM')).toBe('items');
      expect(getUnitLabel('LITER')).toBe('liters');
    });

    test('should return input for invalid unit', () => {
      expect(getUnitLabel('INVALID_UNIT')).toBe('INVALID_UNIT');
    });
  });
});
