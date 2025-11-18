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
  getFoodImageClass
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
        { value: "PREPARED_MEALS", label: "Prepared Meals" },
        { value: "BAKERY_PASTRY", label: "Bakery & Pastry" },
        { value: "FRUITS_VEGETABLES", label: "Fruits & Vegetables" },
        { value: "PACKAGED_PANTRY", label: "Packaged / Pantry Items" },
        { value: "DAIRY_COLD", label: "Dairy & Cold Items" },
        { value: "FROZEN", label: "Frozen Food" },
      ];

      expectedOptions.forEach(expectedOption => {
        expect(foodTypeOptions).toContainEqual(expectedOption);
      });
    });

    test('should have unique values', () => {
      const values = foodTypeOptions.map(option => option.value);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });
  });

  describe('unitOptions', () => {
    test('should be an array with correct structure', () => {
      expect(Array.isArray(unitOptions)).toBe(true);
      expect(unitOptions.length).toBeGreaterThan(0);
      
      unitOptions.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    test('should contain expected unit options', () => {
      const expectedOptions = [
        { value: "KILOGRAM", label: "kg" },
        { value: "ITEM", label: "items" },
        { value: "LITER", label: "liters" },
        { value: "POUND", label: "lbs" },
        { value: "BOX", label: "boxes" },
      ];

      expectedOptions.forEach(expectedOption => {
        expect(unitOptions).toContainEqual(expectedOption);
      });
    });

    test('should have unique values', () => {
      const values = unitOptions.map(option => option.value);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });
  });

  describe('getFoodTypeLabel', () => {
    test('should return correct label for valid enum values', () => {
      expect(getFoodTypeLabel('PREPARED_MEALS')).toBe('Prepared Meals');
      expect(getFoodTypeLabel('BAKERY_PASTRY')).toBe('Bakery & Pastry');
      expect(getFoodTypeLabel('FRUITS_VEGETABLES')).toBe('Fruits & Vegetables');
      expect(getFoodTypeLabel('PACKAGED_PANTRY')).toBe('Packaged / Pantry Items');
      expect(getFoodTypeLabel('DAIRY_COLD')).toBe('Dairy & Cold Items');
      expect(getFoodTypeLabel('FROZEN')).toBe('Frozen Food');
    });

    test('should return input value for invalid enum values', () => {
      expect(getFoodTypeLabel('INVALID_TYPE')).toBe('INVALID_TYPE');
      expect(getFoodTypeLabel('RANDOM_STRING')).toBe('RANDOM_STRING');
    });

    test('should handle edge cases', () => {
      expect(getFoodTypeLabel('')).toBe('');
      expect(getFoodTypeLabel(null)).toBe(null);
      expect(getFoodTypeLabel(undefined)).toBe(undefined);
    });
  });

  describe('getUnitLabel', () => {
    test('should return correct label for valid unit values', () => {
      expect(getUnitLabel('KILOGRAM')).toBe('kg');
      expect(getUnitLabel('ITEM')).toBe('items');
      expect(getUnitLabel('LITER')).toBe('liters');
      expect(getUnitLabel('POUND')).toBe('lbs');
      expect(getUnitLabel('BOX')).toBe('boxes');
    });

    test('should return input value for invalid unit values', () => {
      expect(getUnitLabel('INVALID_UNIT')).toBe('INVALID_UNIT');
      expect(getUnitLabel('RANDOM_UNIT')).toBe('RANDOM_UNIT');
    });

    test('should handle edge cases', () => {
      expect(getUnitLabel('')).toBe('');
      expect(getUnitLabel(null)).toBe(null);
      expect(getUnitLabel(undefined)).toBe(undefined);
    });
  });

  describe('getFoodTypeValue', () => {
    test('should return correct value for valid display labels', () => {
      expect(getFoodTypeValue('Prepared Meals')).toBe('PREPARED_MEALS');
      expect(getFoodTypeValue('Bakery & Pastry')).toBe('BAKERY_PASTRY');
      expect(getFoodTypeValue('Fruits & Vegetables')).toBe('FRUITS_VEGETABLES');
      expect(getFoodTypeValue('Packaged / Pantry Items')).toBe('PACKAGED_PANTRY');
      expect(getFoodTypeValue('Dairy & Cold Items')).toBe('DAIRY_COLD');
      expect(getFoodTypeValue('Frozen Food')).toBe('FROZEN');
    });

    test('should return input value for invalid labels', () => {
      expect(getFoodTypeValue('Invalid Label')).toBe('Invalid Label');
      expect(getFoodTypeValue('Random Text')).toBe('Random Text');
    });

    test('should handle edge cases', () => {
      expect(getFoodTypeValue('')).toBe('');
      expect(getFoodTypeValue(null)).toBe(null);
      expect(getFoodTypeValue(undefined)).toBe(undefined);
    });
  });

  describe('foodTypeImages', () => {
    test('should be an object with correct structure', () => {
      expect(typeof foodTypeImages).toBe('object');
      expect(foodTypeImages).not.toBeNull();
    });

    test('should contain images for all food type labels', () => {
      const expectedKeys = [
        'Bakery & Pastry',
        'Fruits & Vegetables',
        'Packaged / Pantry Items',
        'Dairy & Cold Items',
        'Frozen Food',
        'Prepared Meals'
      ];

      expectedKeys.forEach(key => {
        expect(foodTypeImages).toHaveProperty(key);
        expect(typeof foodTypeImages[key]).toBe('string');
      });
    });

    test('should have valid image paths', () => {
      Object.values(foodTypeImages).forEach(imagePath => {
        expect(typeof imagePath).toBe('string');
        expect(imagePath.length).toBeGreaterThan(0);
      });
    });
  });

  describe('foodTypeClasses', () => {
    test('should be an object with correct structure', () => {
      expect(typeof foodTypeClasses).toBe('object');
      expect(foodTypeClasses).not.toBeNull();
    });

    test('should contain CSS classes for all food type labels', () => {
      const expectedMappings = {
        'Bakery & Pastry': 'food-image-bakery',
        'Fruits & Vegetables': 'food-image-fruits-veg',
        'Packaged / Pantry Items': 'food-image-packaged',
        'Dairy & Cold Items': 'food-image-dairy',
        'Frozen Food': 'food-image-frozen',
        'Prepared Meals': 'food-image-prepared'
      };

      Object.entries(expectedMappings).forEach(([key, expectedClass]) => {
        expect(foodTypeClasses[key]).toBe(expectedClass);
      });
    });
  });

  describe('getFoodCategoryDisplays', () => {
    test('should return array of display labels for valid food categories', () => {
      const categories = ['FRUITS_VEGETABLES', 'BAKERY_PASTRY'];
      const result = getFoodCategoryDisplays(categories);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['Fruits & Vegetables', 'Bakery & Pastry']);
    });

    test('should handle single category', () => {
      const categories = ['PREPARED_MEALS'];
      const result = getFoodCategoryDisplays(categories);
      
      expect(result).toEqual(['Prepared Meals']);
    });

    test('should handle empty array', () => {
      const result = getFoodCategoryDisplays([]);
      expect(result).toEqual(['Other']);
    });

    test('should handle null/undefined input', () => {
      expect(getFoodCategoryDisplays(null)).toEqual(['Other']);
      expect(getFoodCategoryDisplays(undefined)).toEqual(['Other']);
    });

    test('should handle non-array input', () => {
      expect(getFoodCategoryDisplays('not-an-array')).toEqual(['Other']);
      expect(getFoodCategoryDisplays(123)).toEqual(['Other']);
    });

    test('should handle mixed valid and invalid categories', () => {
      const categories = ['FRUITS_VEGETABLES', 'INVALID_CATEGORY', 'BAKERY_PASTRY'];
      const result = getFoodCategoryDisplays(categories);
      
      expect(result).toEqual(['Fruits & Vegetables', 'INVALID_CATEGORY', 'Bakery & Pastry']);
    });
  });

  describe('getPrimaryFoodCategory', () => {
    test('should return display label for first valid category', () => {
      const categories = ['FRUITS_VEGETABLES', 'BAKERY_PASTRY'];
      const result = getPrimaryFoodCategory(categories);
      
      expect(result).toBe('Fruits & Vegetables');
    });

    test('should handle single category', () => {
      const categories = ['PREPARED_MEALS'];
      const result = getPrimaryFoodCategory(categories);
      
      expect(result).toBe('Prepared Meals');
    });

    test('should return "Other" for empty array', () => {
      const result = getPrimaryFoodCategory([]);
      expect(result).toBe('Other');
    });

    test('should return "Other" for null/undefined input', () => {
      expect(getPrimaryFoodCategory(null)).toBe('Other');
      expect(getPrimaryFoodCategory(undefined)).toBe('Other');
    });

    test('should return "Other" for non-array input', () => {
      expect(getPrimaryFoodCategory('not-an-array')).toBe('Other');
      expect(getPrimaryFoodCategory(123)).toBe('Other');
    });

    test('should handle invalid first category', () => {
      const categories = ['INVALID_CATEGORY', 'BAKERY_PASTRY'];
      const result = getPrimaryFoodCategory(categories);
      
      expect(result).toBe('INVALID_CATEGORY');
    });
  });

  describe('getFoodImageClass', () => {
    test('should return correct CSS class for valid food types', () => {
      expect(getFoodImageClass('Bakery & Pastry')).toBe('food-image-bakery');
      expect(getFoodImageClass('Fruits & Vegetables')).toBe('food-image-fruits-veg');
      expect(getFoodImageClass('Packaged / Pantry Items')).toBe('food-image-packaged');
      expect(getFoodImageClass('Dairy & Cold Items')).toBe('food-image-dairy');
      expect(getFoodImageClass('Frozen Food')).toBe('food-image-frozen');
      expect(getFoodImageClass('Prepared Meals')).toBe('food-image-prepared');
    });

    test('should return default class for invalid food types', () => {
      expect(getFoodImageClass('Invalid Food Type')).toBe('food-image-packaged');
      expect(getFoodImageClass('Random Text')).toBe('food-image-packaged');
    });

    test('should handle edge cases', () => {
      expect(getFoodImageClass('')).toBe('food-image-packaged');
      expect(getFoodImageClass(null)).toBe('food-image-packaged');
      expect(getFoodImageClass(undefined)).toBe('food-image-packaged');
    });
  });

  describe('Integration tests', () => {
    test('getFoodTypeLabel and getFoodTypeValue should be inverse functions', () => {
      foodTypeOptions.forEach(option => {
        const label = getFoodTypeLabel(option.value);
        const value = getFoodTypeValue(label);
        expect(value).toBe(option.value);
      });
    });

    test('all food type labels should have corresponding images and CSS classes', () => {
      foodTypeOptions.forEach(option => {
        const label = getFoodTypeLabel(option.value);
        expect(foodTypeImages).toHaveProperty(label);
        expect(foodTypeClasses).toHaveProperty(label);
      });
    });

    test('getFoodCategoryDisplays should work with getPrimaryFoodCategory', () => {
      const categories = ['FRUITS_VEGETABLES', 'BAKERY_PASTRY', 'PREPARED_MEALS'];
      const displays = getFoodCategoryDisplays(categories);
      const primary = getPrimaryFoodCategory(categories);
      
      expect(displays).toContain(primary);
      expect(primary).toBe(displays[0]);
    });

    test('foodTypeClasses keys should match getFoodImageClass input expectations', () => {
      Object.keys(foodTypeClasses).forEach(foodType => {
        const cssClass = getFoodImageClass(foodType);
        expect(cssClass).toBe(foodTypeClasses[foodType]);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle case sensitivity', () => {
      expect(getFoodTypeLabel('fruits_vegetables')).toBe('fruits_vegetables');
      expect(getFoodTypeLabel('FRUITS_VEGETABLES')).toBe('Fruits & Vegetables');
    });

    test('should handle whitespace', () => {
      expect(getFoodTypeLabel(' FRUITS_VEGETABLES ')).toBe(' FRUITS_VEGETABLES ');
      expect(getFoodTypeValue(' Fruits & Vegetables ')).toBe(' Fruits & Vegetables ');
    });

    test('should handle numeric inputs', () => {
      expect(getFoodTypeLabel(123)).toBe(123);
      expect(getUnitLabel(456)).toBe(456);
      expect(getFoodTypeValue(789)).toBe(789);
    });

    test('should handle boolean inputs', () => {
      expect(getFoodTypeLabel(true)).toBe(true);
      expect(getUnitLabel(false)).toBe(false);
      expect(getFoodTypeValue(true)).toBe(true);
    });
  });
});
