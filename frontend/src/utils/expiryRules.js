import {
  getFoodTypeLabel,
  getTemperatureCategoryLabel,
} from '../constants/foodConstants';

const SHELF_LIFE_DAYS = {
  PREPARED: {
    FROZEN: 30,
    REFRIGERATED: 3,
    ROOM_TEMPERATURE: 0,
    HOT_COOKED: 0,
  },
  PRODUCE: {
    FROZEN: 30,
    REFRIGERATED: 5,
    ROOM_TEMPERATURE: 2,
    HOT_COOKED: 2,
  },
  BAKERY: {
    FROZEN: 30,
    REFRIGERATED: 3,
    ROOM_TEMPERATURE: 1,
    HOT_COOKED: 1,
  },
  DAIRY_EGGS: {
    FROZEN: 30,
    REFRIGERATED: 3,
    ROOM_TEMPERATURE: 0,
    HOT_COOKED: 0,
  },
  MEAT_POULTRY: {
    FROZEN: 30,
    REFRIGERATED: 1,
    ROOM_TEMPERATURE: 0,
    HOT_COOKED: 0,
  },
  SEAFOOD: {
    FROZEN: 30,
    REFRIGERATED: 1,
    ROOM_TEMPERATURE: 0,
    HOT_COOKED: 0,
  },
  PANTRY: {
    FROZEN: 60,
    REFRIGERATED: 30,
    ROOM_TEMPERATURE: 30,
    HOT_COOKED: 30,
  },
  BEVERAGES: {
    FROZEN: 30,
    REFRIGERATED: 7,
    ROOM_TEMPERATURE: 7,
    HOT_COOKED: 0,
  },
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateYYYYMMDD = date => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseFabricationDate = fabricationDate => {
  if (!fabricationDate) {
    return null;
  }
  if (fabricationDate instanceof Date) {
    return Number.isNaN(fabricationDate.getTime()) ? null : fabricationDate;
  }
  if (typeof fabricationDate === 'string') {
    const match = fabricationDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }
  const parsed = new Date(fabricationDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeEligibility = (foodType, temperatureCategory) => {
  if (!foodType || !temperatureCategory) {
    return true;
  }
  if (
    temperatureCategory === 'ROOM_TEMPERATURE' &&
    ['PREPARED', 'DAIRY_EGGS', 'MEAT_POULTRY', 'SEAFOOD'].includes(foodType)
  ) {
    return false;
  }
  if (
    temperatureCategory === 'HOT_COOKED' &&
    ['DAIRY_EGGS', 'MEAT_POULTRY', 'SEAFOOD'].includes(foodType)
  ) {
    return false;
  }
  return true;
};

export const computeSuggestedExpiry = ({
  foodType,
  temperatureCategory,
  packagingType,
  fabricationDate,
}) => {
  const warnings = [];

  if (
    packagingType === 'REFRIGERATED_CONTAINER' &&
    (temperatureCategory === 'ROOM_TEMPERATURE' ||
      temperatureCategory === 'HOT_COOKED')
  ) {
    warnings.push('Packaging suggests cold storage, confirm temperature');
  }

  if (
    packagingType === 'FROZEN_CONTAINER' &&
    temperatureCategory &&
    temperatureCategory !== 'FROZEN'
  ) {
    warnings.push('Packaging suggests frozen storage, confirm temperature');
  }

  if (foodType === 'PREPARED' && temperatureCategory === 'HOT_COOKED') {
    warnings.push(
      'Hot food must be cooled and refrigerated to be eligible for donation'
    );
  }
  if (foodType === 'PRODUCE' && temperatureCategory === 'HOT_COOKED') {
    warnings.push('Produce is usually not hot/cooked');
  }
  if (foodType === 'PANTRY' && temperatureCategory === 'HOT_COOKED') {
    warnings.push('Pantry items are usually stored at room temperature');
  }
  if (foodType === 'BEVERAGES' && temperatureCategory === 'HOT_COOKED') {
    warnings.push('Hot beverages are same-day donations');
  }

  const shelfLifeDays =
    SHELF_LIFE_DAYS[foodType]?.[temperatureCategory] ?? null;
  const eligible = computeEligibility(foodType, temperatureCategory);
  const parsedFabricationDate = parseFabricationDate(fabricationDate);

  if (!parsedFabricationDate || shelfLifeDays == null) {
    return {
      suggestedExpiryDate: null,
      shelfLifeDays,
      eligible,
      warnings,
      explanation: null,
    };
  }

  const suggestedDate = addDays(parsedFabricationDate, shelfLifeDays);
  const suggestedExpiryDate = formatDateYYYYMMDD(suggestedDate);
  const explanation = `Suggested expiry: ${suggestedExpiryDate} (based on ${getFoodTypeLabel(
    foodType
  )} + ${getTemperatureCategoryLabel(temperatureCategory)})`;

  return {
    suggestedExpiryDate,
    shelfLifeDays,
    eligible,
    warnings,
    explanation,
  };
};
