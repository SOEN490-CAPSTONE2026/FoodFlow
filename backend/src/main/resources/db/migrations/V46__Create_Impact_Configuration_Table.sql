-- Create impact_configuration table for storing environmental impact calculation factors
CREATE TABLE impact_configuration (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    emission_factors_json TEXT NOT NULL,
    water_factors_json TEXT NOT NULL,
    min_meal_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    max_meal_weight_kg DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    default_emission_factor DOUBLE PRECISION NOT NULL DEFAULT 1.9,
    default_water_factor DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    disclosure_text TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create index on version for faster lookups
CREATE INDEX idx_impact_configuration_version ON impact_configuration(version);

-- Create index on is_active for querying active configurations
CREATE INDEX idx_impact_configuration_is_active ON impact_configuration(is_active);
