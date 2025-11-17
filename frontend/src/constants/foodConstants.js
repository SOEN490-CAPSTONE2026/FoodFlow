// Static image imports
import BakeryPastryImage from '../assets/foodtypes/Pastry&Bakery.jpg';
import FruitsVeggiesImage from '../assets/foodtypes/Fruits&Vegetables.jpg';
import PackagedPantryImage from '../assets/foodtypes/PackagedItems.jpg';
import DairyColdImage from '../assets/foodtypes/Dairy.jpg';
import FrozenFoodImage from '../assets/foodtypes/FrozenFood.jpg';
import PreparedMealsImage from '../assets/foodtypes/PreparedFood.jpg';

// Food type options for dropdowns and forms
export const foodTypeOptions = [
  { value: "PREPARED_MEALS", label: "Prepared Meals" },
  { value: "BAKERY_PASTRY", label: "Bakery & Pastry" },
  { value: "FRUITS_VEGETABLES", label: "Fruits & Vegetables" },
  { value: "PACKAGED_PANTRY", label: "Packaged / Pantry Items" },
  { value: "DAIRY_COLD", label: "Dairy & Cold Items" },
  { value: "FROZEN", label: "Frozen Food" },
];

// Unit options for quantity selection
export const unitOptions = [
  { value: "KILOGRAM", label: "kg" },
  { value: "ITEM", label: "items" },
  { value: "LITER", label: "liters" },
  { value: "POUND", label: "lbs" },
  { value: "BOX", label: "boxes" },
];

// Helper function to get label from value
export const getFoodTypeLabel = (value) => {
  const option = foodTypeOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get unit label from value  
export const getUnitLabel = (value) => {
  const option = unitOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get value from label (reverse mapping)
export const getFoodTypeValue = (label) => {
  const option = foodTypeOptions.find(opt => opt.label === label);
  return option ? option.value : label;
};

// Food type image mappings (direct image imports)
export const foodTypeImages = {
  "Bakery & Pastry": BakeryPastryImage,
  "Fruits & Vegetables": FruitsVeggiesImage,
  "Packaged / Pantry Items": PackagedPantryImage,
  "Dairy & Cold Items": DairyColdImage,
  "Frozen Food": FrozenFoodImage,
  "Prepared Meals": PreparedMealsImage,
};

// Food type CSS class mappings
export const foodTypeClasses = {
  "Bakery & Pastry": "food-image-bakery",
  "Fruits & Vegetables": "food-image-fruits-veg", 
  "Packaged / Pantry Items": "food-image-packaged",
  "Dairy & Cold Items": "food-image-dairy",
  "Frozen Food": "food-image-frozen",
  "Prepared Meals": "food-image-prepared",
};

// Utility function to get all category display labels from enum values
export const getFoodCategoryDisplays = (foodCategories) => {
  if (!foodCategories || !Array.isArray(foodCategories) || foodCategories.length === 0) {
    return ["Other"];
  }

  return foodCategories.map((category) => getFoodTypeLabel(category));
};

// Utility function to get primary food category display label
export const getPrimaryFoodCategory = (foodCategories) => {
  if (!foodCategories || !Array.isArray(foodCategories) || foodCategories.length === 0) {
    return "Other";
  }

  const category = foodCategories[0];
  return getFoodTypeLabel(category);
};

// Utility function to get CSS class for food type
export const getFoodImageClass = (foodType) => {
  return foodTypeClasses[foodType] || "food-image-packaged";
};