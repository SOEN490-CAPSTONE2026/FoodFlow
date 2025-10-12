package com.example.foodflow.model.types;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Positive;

import java.util.Objects;

@Embeddable
public class Quantity {

    @Column(name = "quantity_value")
    @Positive(message = "Quantity must be positive")
    private Double value;

    @Enumerated(EnumType.STRING)
    private Unit unit;

    public Quantity() {} // Required by JPA

    public Quantity(Double value, Unit unit) {
        this.value = Objects.requireNonNull(value, "Quantity value cannot be null");
        this.unit = Objects.requireNonNull(unit, "Quantity unit cannot be null");
        validate();
    }

    private void validate() {
        if (value == null || unit == null){
            return;
        }

        // Example validation: integer-only units
        if (unit.isIntegerOnly() && Math.abs(value - Math.round(value)) > 1e-9) {
            throw new IllegalArgumentException("Unit " + unit + " only accepts integer values");
        }
    }

    public Double getValue() {
        return value;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setValue(Double value) {
        this.value = Objects.requireNonNull(value);
        validate();
    }

    public void setUnit(Unit unit) {
        this.unit = Objects.requireNonNull(unit);
        validate();
    }

    @Override
    public String toString() {
        return value + " " + unit;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Quantity)) return false;
        Quantity that = (Quantity) o;
        return Double.compare(that.value, value) == 0 &&
               Objects.equals(unit, that.unit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value, unit);
    }


    public enum Unit {
        // Weight units
        KILOGRAM("kg", false),
        GRAM("g", false),
        POUND("lb", false),
        OUNCE("oz", false),
        TON("t", false),
        
        // Volume units
        LITER("L", false),
        MILLILITER("mL", false),
        GALLON("gal", false),
        QUART("qt", false),
        PINT("pt", false),
        FLUID_OUNCE("fl oz", false),
        CUP("cups", false),

        // Count units (integer only)
        PIECE("pieces", true),
        ITEM("items", true),
        UNIT("units", true),
        CAN("cans", true),
        BOTTLE("bottles", true),
        JAR("jars", true),
        PACKAGE("packages", true),
        BOX("boxes", true),
        BAG("bags", true),
        CARTON("cartons", true),
        CONTAINER("containers", true),
        CASE("cases", true),
        DOZEN("dozen", true),
        SERVING("servings", true),
        PORTION("portions", true),
        LOAF("loaves", true),
        BUNCH("bunches", true),
        HEAD("heads", true);
        
        private final String label;
        private final boolean integerOnly;
        
        Unit(String label, boolean integerOnly) {
            this.label = label;
            this.integerOnly = integerOnly;
        }
        
        public boolean isIntegerOnly() {
            return integerOnly;
        }
        
        public String getFullName() {
            // Convert enum name to readable format: KILOGRAM -> kilogram
            String name = this.name();
            return name.toLowerCase().replace('_', ' ');
        }
        
        public String getPlural() {
            String full = getFullName();
            // Handle special cases
            if (full.equals("Box")) return "boxes";
            if (full.equals("Bunch")) return "bunches";
            if (full.equals("Loaf")) return "loaves";
            if (full.equals("Dozen")) return "dozen";
            // Default: add 's'
            return full + "s";
        }
        
        public String getDisplayName(double quantity) {
            return quantity == 1.0 ? getFullName() : getPlural();
        }

        @Override
        public String toString(){
            return label;
        }
    }
}
