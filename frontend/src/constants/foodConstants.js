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

// Temperature category options for food safety compliance
export const temperatureCategoryOptions = [
  { value: "FROZEN", label: "Frozen (below 0°C)", icon: "❄️" },
  { value: "REFRIGERATED", label: "Refrigerated (0–4°C)", icon: "🧊" },
  { value: "ROOM_TEMPERATURE", label: "Room Temperature", icon: "🌡️" },
  { value: "HOT_COOKED", label: "Hot / Cooked", icon: "🔥" },
];

// Packaging type options for food safety compliance
export const packagingTypeOptions = [
  { value: "SEALED", label: "Sealed" },
  { value: "LOOSE", label: "Loose" },
  { value: "REFRIGERATED_CONTAINER", label: "Refrigerated Container" },
  { value: "FROZEN_CONTAINER", label: "Frozen Container" },
  { value: "VACUUM_PACKED", label: "Vacuum Packed" },
  { value: "BOXED", label: "Boxed" },
  { value: "WRAPPED", label: "Wrapped" },
  { value: "BULK", label: "Bulk" },
  { value: "OTHER", label: "Other" },
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

// Helper function to get temperature category label from value
export const getTemperatureCategoryLabel = (value) => {
  const option = temperatureCategoryOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

// Helper function to get temperature category icon from value
export const getTemperatureCategoryIcon = (value) => {
  const option = temperatureCategoryOptions.find(opt => opt.value === value);
  return option ? option.icon : "🌡️";
};

// Helper function to get packaging type label from value
export const getPackagingTypeLabel = (value) => {
  const option = packagingTypeOptions.find(opt => opt.value === value);
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