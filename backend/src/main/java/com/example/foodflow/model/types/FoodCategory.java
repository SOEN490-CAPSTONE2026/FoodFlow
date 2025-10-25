package com.example.foodflow.model.types;

public enum FoodCategory {
    // Fruits & Vegetables (more specific)
    FRUITS_VEGETABLES("Fruits & Vegetables"),
    LEAFY_GREENS,
    ROOT_VEGETABLES,
    BERRIES,
    CITRUS_FRUITS,
    TROPICAL_FRUITS,
    
    // Grains & Breads
    BREAD,
    BAKED_GOODS("Bakery & Pastry"),
    BAKERY_ITEMS,
    WHOLE_GRAINS,
    CEREALS,
    PASTA,
    RICE,
    FLOUR_BAKING_MIXES,
    
    // Proteins
    FRESH_MEAT,
    GROUND_MEAT,
    POULTRY,
    FISH,
    SEAFOOD,
    EGGS,
    LEGUMES,
    BEANS,
    LENTILS,
    CHICKPEAS,
    TOFU_TEMPEH,
    PLANT_BASED_PROTEIN,
    
    // Dairy & Alternatives
    MILK,
    CHEESE,
    YOGURT,
    BUTTER,
    CREAM,
    MILK_ALTERNATIVES,
    PLANT_BASED_DAIRY,
    
    // Canned & Jarred
    CANNED_VEGETABLES,
    CANNED_FRUITS,
    CANNED_BEANS,
    CANNED_SOUP,
    CANNED_MEAT_FISH,
    TOMATO_PRODUCTS,
    PICKLED_ITEMS,
    PRESERVES_JAMS,
    PEANUT_BUTTER,
    NUT_BUTTERS,
    
    // Frozen Foods
    FROZEN("Frozen Food"),
    FROZEN_VEGETABLES,
    FROZEN_FRUITS,
    FROZEN_MEALS,
    FROZEN_MEAT,
    FROZEN_SEAFOOD,
    FROZEN_DESSERTS,
    ICE_CREAM,
    
    // Dried & Shelf-Stable
    DRIED_FRUITS,
    DRIED_VEGETABLES,
    DRIED_HERBS,
    DRIED_PASTA,
    INSTANT_NOODLES,
    
    // Prepared & Ready-to-Eat
    PREPARED_MEALS("Prepared Meals"),
    READY_TO_EAT,
    SANDWICHES,
    SALADS,
    SOUPS,
    STEWS,
    CASSEROLES,
    LEFTOVERS,
    
    // Snacks & Sweets
    CHIPS_CRACKERS,
    COOKIES,
    CANDY,
    CHOCOLATE,
    GRANOLA_BARS,
    ENERGY_BARS,
    POPCORN,
    PRETZELS,
    TRAIL_MIX,
    DESSERTS,
    CAKES_PASTRIES,
    
    // Beverages
    BEVERAGES,
    WATER,
    JUICE,
    SOFT_DRINKS,
    SPORTS_DRINKS,
    TEA,
    COFFEE,
    HOT_CHOCOLATE,
    PROTEIN_SHAKES,
    SMOOTHIES,
    
    // Condiments & Sauces
    CONDIMENTS,
    SAUCES,
    SALAD_DRESSING,
    COOKING_SAUCES,
    GRAVY,
    MAYONNAISE,
    KETCHUP,
    MUSTARD,
    HOT_SAUCE,
    SOY_SAUCE,
    VINEGAR,
    
    // Cooking Essentials
    COOKING_OIL,
    OLIVE_OIL,
    VEGETABLE_OIL,
    SPICES,
    SEASONINGS,
    SALT_PEPPER,
    SUGAR,
    HONEY,
    SYRUP,
    BAKING_INGREDIENTS,
    BAKING_POWDER_SODA,
    YEAST,
    VANILLA_EXTRACT,
    
    // Nuts & Seeds
    NUTS,
    SEEDS,
    ALMONDS,
    WALNUTS,
    CASHEWS,
    PEANUTS,
    SUNFLOWER_SEEDS,
    CHIA_SEEDS,
    
    // Baby & Infant
    BABY_FOOD,
    INFANT_FORMULA,
    BABY_CEREAL,
    BABY_SNACKS,
    
    // Special Dietary Products
    GLUTEN_FREE_PRODUCTS,
    DIABETIC_FRIENDLY,
    LOW_SODIUM,
    LOW_FAT,
    SUGAR_FREE,
    PROTEIN_SUPPLEMENTS,
    NUTRITIONAL_SHAKES,
    MEAL_REPLACEMENT,
    
    // Dietary Labels
    VEGETARIAN,
    DAIRY("Dairy & Cold Items"),
    VEGAN,
    GLUTEN_FREE,
    DAIRY_FREE,
    NUT_FREE,
    SOY_FREE,
    EGG_FREE,
    KOSHER,
    HALAL,
    ORGANIC,
    NON_GMO,
    FAIR_TRADE,
    LOCAL,
    
    // Perishability
    PERISHABLE,
    NON_PERISHABLE,
    REFRIGERATED,
    SHELF_STABLE,
    
    // Meal Types
    BREAKFAST_ITEMS,
    LUNCH_ITEMS,
    DINNER_ITEMS,
    
    // Other
    MIXED_ITEMS,
    ASSORTED,
    PACKAGED("Packaged / Pantry Items"),
    BULK_ITEMS,
    EMERGENCY_FOOD_KIT,
    MRE_MILITARY_RATIONS,
    PET_FOOD,
    OTHER;

    private String label;

    FoodCategory(String label){
        this.label = label;
    }

    FoodCategory(){
        this.label = getDisplayName();
    }

    public String getLabel(){
        return label;
    }
    
    public String getDisplayName() {
        String[] words = this.name().split("_");
        StringBuilder result = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            // Capitalize first letter, lowercase the rest
            result.append(word.charAt(0))
                  .append(word.substring(1).toLowerCase());
            
            if (i < words.length - 1) {
                result.append(" ");
            }
        }
        
        return result.toString();
    }
    
    public boolean isDietaryLabel() {
        return this == VEGETARIAN || this == VEGAN || this == GLUTEN_FREE || 
               this == DAIRY_FREE || this == NUT_FREE || this == SOY_FREE ||
               this == EGG_FREE || this == KOSHER || this == HALAL || 
               this == ORGANIC || this == NON_GMO || this == FAIR_TRADE || 
               this == LOCAL;
    }
    
    public boolean isPerishabilityLabel() {
        return this == PERISHABLE || this == NON_PERISHABLE || 
               this == REFRIGERATED || this == SHELF_STABLE;
    }
    
    public boolean isAllergenLabel() {
        return this == NUT_FREE || this == DAIRY_FREE || this == GLUTEN_FREE ||
               this == SOY_FREE || this == EGG_FREE;
    }
    
    public boolean isFoodType() {
        return !isDietaryLabel() && !isPerishabilityLabel();
    }
}