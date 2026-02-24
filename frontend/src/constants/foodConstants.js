import React from 'react';

// Static image imports
import BakeryPastryImage from '../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../assets/foodtypes/Dairy.jpg';
import { Snowflake, Refrigerator, Thermometer, Flame } from 'lucide-react';
import FrozenFoodImage from '../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../assets/foodtypes/PreparedFood.jpg';

// Food type options for dropdowns and forms
export const foodTypeOptions = [
  { value: 'PREPARED', label: 'Prepared Meals' },
  { value: 'PRODUCE', label: 'Produce' },
  { value: 'BAKERY', label: 'Bakery & Pastry' },
  { value: 'DAIRY_EGGS', label: 'Dairy & Eggs' },
  { value: 'MEAT_POULTRY', label: 'Meat & Poultry' },
  { value: 'SEAFOOD', label: 'Seafood' },
  { value: 'PANTRY', label: 'Packaged / Pantry Items' },
  { value: 'BEVERAGES', label: 'Beverages' },
];

// Dietary tags options for dropdowns and filters
export const dietaryTagOptions = [
  { value: 'HALAL', label: 'Halal' },
  { value: 'KOSHER', label: 'Kosher' },
  { value: 'VEGETARIAN', label: 'Vegetarian' },
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'GLUTEN_FREE', label: 'Gluten Free' },
  { value: 'DAIRY_FREE', label: 'Dairy Free' },
  { value: 'NUT_FREE', label: 'Nut Free' },
  { value: 'EGG_FREE', label: 'Egg Free' },
  { value: 'SOY_FREE', label: 'Soy Free' },
];

const legacyFoodCategoryToFoodType = {
  PREPARED_MEALS: 'PREPARED',
  READY_TO_EAT: 'PREPARED',
  SALADS: 'PREPARED',
  SOUPS: 'PREPARED',
  STEWS: 'PREPARED',
  CASSEROLES: 'PREPARED',
  LEFTOVERS: 'PREPARED',
  FRUITS_VEGETABLES: 'PRODUCE',
  LEAFY_GREENS: 'PRODUCE',
  ROOT_VEGETABLES: 'PRODUCE',
  BERRIES: 'PRODUCE',
  CITRUS_FRUITS: 'PRODUCE',
  TROPICAL_FRUITS: 'PRODUCE',
  BAKERY_PASTRY: 'BAKERY',
  BREAD: 'BAKERY',
  BAKED_GOODS: 'BAKERY',
  BAKERY_ITEMS: 'BAKERY',
  DAIRY_COLD: 'DAIRY_EGGS',
  DAIRY: 'DAIRY_EGGS',
  EGGS: 'DAIRY_EGGS',
  FRESH_MEAT: 'MEAT_POULTRY',
  GROUND_MEAT: 'MEAT_POULTRY',
  POULTRY: 'MEAT_POULTRY',
  FISH: 'SEAFOOD',
  SEAFOOD: 'SEAFOOD',
  PACKAGED_PANTRY: 'PANTRY',
  CANNED_SOUP: 'PANTRY',
  CANNED_VEGETABLES: 'PANTRY',
  CANNED_FRUITS: 'PANTRY',
  BEVERAGES: 'BEVERAGES',
  FROZEN: 'MEAT_POULTRY',
};

const foodTypeToLegacyFoodCategory = {
  PREPARED: 'PREPARED_MEALS',
  PRODUCE: 'FRUITS_VEGETABLES',
  BAKERY: 'BAKERY_PASTRY',
  DAIRY_EGGS: 'DAIRY_COLD',
  MEAT_POULTRY: 'FRESH_MEAT',
  SEAFOOD: 'SEAFOOD',
  PANTRY: 'PACKAGED_PANTRY',
  BEVERAGES: 'BEVERAGES',
};

// Unit options for quantity selection
export const unitOptions = [
  { value: 'KILOGRAM', label: 'kg' },
  { value: 'ITEM', label: 'items' },
  { value: 'LITER', label: 'liters' },
  { value: 'POUND', label: 'lbs' },
  { value: 'BOX', label: 'boxes' },
];

// Temperature category options for food safety compliance
export const temperatureCategoryOptions = [
  { value: 'FROZEN', label: 'Frozen (below 0°C)', icon: Snowflake },
  { value: 'REFRIGERATED', label: 'Refrigerated (0–4°C)', icon: Refrigerator },
  { value: 'ROOM_TEMPERATURE', label: 'Room Temperature', icon: Thermometer },
  { value: 'HOT_COOKED', label: 'Hot / Cooked', icon: Flame },
];

// Packaging type options for food safety compliance
export const packagingTypeOptions = [
  { value: 'SEALED', label: 'Sealed' },
  { value: 'LOOSE', label: 'Loose' },
  { value: 'REFRIGERATED_CONTAINER', label: 'Refrigerated Container' },
  { value: 'FROZEN_CONTAINER', label: 'Frozen Container' },
  { value: 'VACUUM_PACKED', label: 'Vacuum Packed' },
  { value: 'BOXED', label: 'Boxed' },
  { value: 'WRAPPED', label: 'Wrapped' },
  { value: 'BULK', label: 'Bulk' },
  { value: 'OTHER', label: 'Other' },
];

// Helper function to get label from value
export const getFoodTypeLabel = value => {
  const normalizedValue = legacyFoodCategoryToFoodType[value] || value;
  const option = foodTypeOptions.find(opt => opt.value === normalizedValue);
  return option ? option.label : value;
};

export const getDietaryTagLabel = value => {
  const option = dietaryTagOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get unit label from value
export const getUnitLabel = value => {
  const option = unitOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get temperature category label from value
export const getTemperatureCategoryLabel = value => {
  const option = temperatureCategoryOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get temperature category icon from value
export const getTemperatureCategoryIcon = value => {
  const option = temperatureCategoryOptions.find(opt => opt.value === value);
  const IconComponent = option ? option.icon : Thermometer;
  return <IconComponent size={16} />;
};

// Helper function to get packaging type label from value
export const getPackagingTypeLabel = value => {
  const option = packagingTypeOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get value from label (reverse mapping)
export const getFoodTypeValue = label => {
  const option = foodTypeOptions.find(opt => opt.label === label);
  return option ? option.value : label;
};

export const mapFoodTypeToLegacyCategory = foodTypeValue => {
  return foodTypeToLegacyFoodCategory[foodTypeValue] || foodTypeValue;
};

export const mapLegacyCategoryToFoodType = categoryValue => {
  return legacyFoodCategoryToFoodType[categoryValue] || categoryValue;
};

// Food type image mappings (direct image imports)
export const foodTypeImages = {
  'Bakery & Pastry': BakeryPastryImage,
  Produce: FruitsVeggiesImage,
  'Packaged / Pantry Items': PackagedPantryImage,
  'Dairy & Eggs': DairyColdImage,
  'Meat & Poultry': FrozenFoodImage,
  Seafood: FrozenFoodImage,
  Beverages: FrozenFoodImage,
  'Prepared Meals': PreparedMealsImage,
  FROZEN: FrozenFoodImage,
};

// Food type CSS class mappings
export const foodTypeClasses = {
  'Bakery & Pastry': 'food-image-bakery',
  Produce: 'food-image-fruits-veg',
  'Packaged / Pantry Items': 'food-image-packaged',
  'Dairy & Eggs': 'food-image-dairy',
  'Meat & Poultry': 'food-image-frozen',
  Seafood: 'food-image-frozen',
  Beverages: 'food-image-packaged',
  'Prepared Meals': 'food-image-prepared',
  FROZEN: 'food-image-frozen',
};

// Utility function to get all category display labels from enum values
export const getFoodCategoryDisplays = foodCategories => {
  if (
    !foodCategories ||
    !Array.isArray(foodCategories) ||
    foodCategories.length === 0
  ) {
    return ['Other'];
  }

  return foodCategories.map(category => getFoodTypeLabel(category));
};

// Utility function to get primary food category display label
export const getPrimaryFoodCategory = foodCategories => {
  if (
    !foodCategories ||
    !Array.isArray(foodCategories) ||
    foodCategories.length === 0
  ) {
    return 'Other';
  }

  const category = foodCategories[0];
  return getFoodTypeLabel(category);
};

// Utility function to get CSS class for food type
export const getFoodImageClass = foodType => {
  return foodTypeClasses[foodType] || 'food-image-packaged';
};
