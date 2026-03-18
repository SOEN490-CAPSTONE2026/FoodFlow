-- Step 1: Add FoodType + DietaryTags fields to surplus_posts
ALTER TABLE surplus_posts
    ADD COLUMN IF NOT EXISTS food_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill food_type from existing food categories (best-effort mapping).
-- TODO: Verify/adjust mappings for legacy edge cases after deployment data audit.
UPDATE surplus_posts sp
SET food_type = COALESCE(
    (
        SELECT CASE
            WHEN spft.food_category IN ('PREPARED_MEALS', 'READY_TO_EAT', 'SANDWICHES', 'SALADS', 'SOUPS', 'STEWS', 'CASSEROLES', 'LEFTOVERS')
                THEN 'PREPARED'
            WHEN spft.food_category IN ('FRUITS_VEGETABLES', 'LEAFY_GREENS', 'ROOT_VEGETABLES', 'BERRIES', 'CITRUS_FRUITS', 'TROPICAL_FRUITS')
                THEN 'PRODUCE'
            WHEN spft.food_category IN ('BAKERY_PASTRY', 'BREAD', 'BAKED_GOODS', 'BAKERY_ITEMS', 'CAKES_PASTRIES')
                THEN 'BAKERY'
            WHEN spft.food_category IN ('DAIRY_COLD', 'DAIRY', 'MILK', 'CHEESE', 'YOGURT', 'BUTTER', 'CREAM', 'EGGS')
                THEN 'DAIRY_EGGS'
            WHEN spft.food_category IN ('FRESH_MEAT', 'GROUND_MEAT', 'POULTRY')
                THEN 'MEAT_POULTRY'
            WHEN spft.food_category IN ('SEAFOOD', 'FISH', 'FROZEN_SEAFOOD')
                THEN 'SEAFOOD'
            WHEN spft.food_category IN ('BEVERAGES', 'WATER', 'JUICE', 'SOFT_DRINKS', 'SPORTS_DRINKS', 'TEA', 'COFFEE', 'HOT_CHOCOLATE', 'PROTEIN_SHAKES', 'SMOOTHIES')
                THEN 'BEVERAGES'
            ELSE 'PANTRY'
        END
        FROM surplus_post_food_types spft
        WHERE spft.surplus_post_id = sp.id
        ORDER BY spft.food_category
        LIMIT 1
    ),
    'PANTRY'
)
WHERE sp.food_type IS NULL;

ALTER TABLE surplus_posts
    ALTER COLUMN food_type SET NOT NULL;

ALTER TABLE surplus_posts
    ADD CONSTRAINT chk_surplus_posts_food_type
    CHECK (food_type IN (
        'PREPARED',
        'PRODUCE',
        'BAKERY',
        'DAIRY_EGGS',
        'MEAT_POULTRY',
        'SEAFOOD',
        'PANTRY',
        'BEVERAGES'
    ));

ALTER TABLE surplus_posts
    ADD CONSTRAINT chk_surplus_posts_dietary_tags
    CHECK (dietary_tags <@ ARRAY[
        'HALAL',
        'KOSHER',
        'VEGETARIAN',
        'VEGAN',
        'GLUTEN_FREE',
        'DAIRY_FREE',
        'NUT_FREE',
        'EGG_FREE',
        'SOY_FREE'
    ]::TEXT[]);

-- Step 1 indexes for listing/filter/sort
CREATE INDEX IF NOT EXISTS idx_surplus_posts_status_created_at
    ON surplus_posts(status, created_at);

CREATE INDEX IF NOT EXISTS idx_surplus_posts_food_type_contract
    ON surplus_posts(food_type);

CREATE INDEX IF NOT EXISTS idx_surplus_posts_dietary_tags_gin
    ON surplus_posts USING GIN (dietary_tags);
