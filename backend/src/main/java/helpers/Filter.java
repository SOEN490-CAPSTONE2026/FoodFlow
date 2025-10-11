package helpers;

import java.util.Objects;

/**
 * Generic filter class for any JPA entity.
 * @param <T> Field type (must be Comparable)
 */
public class Filter<T extends Comparable<T>> {

    /**
     * Supported operations for filtering.
     */
    public enum Operation {
        EQUAL,
        NOT_EQUAL,
        GREATER_THAN,
        GREATER_THAN_OR_EQUAL,
        LESS_THAN,
        LESS_THAN_OR_EQUAL
    }
    private final T value;          // value to compare against
    private final Operation operation; // operation type

    /**
     * Private constructor to enforce static factory methods usage.
     */
    protected Filter(T value, Operation operation) {
        this.value = Objects.requireNonNull(value, "Filter value cannot be null");
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
    }

    // ---------------- Static factory methods ----------------

    public static <T extends Comparable<T>> Filter<T> equal(T value) {
        return new Filter<>(value, Operation.EQUAL);
    }

    public static <E, T extends Comparable<T>> Filter<T> notEqual(T value) {
        return new Filter<>(value, Operation.NOT_EQUAL);
    }

    public static <T extends Comparable<T>> Filter<T> greaterThan(T value) {
        return new Filter<>(value, Operation.GREATER_THAN);
    }

    public static <T extends Comparable<T>> Filter<T> greaterThanOrEqual(T value) {
        return new Filter<>(value, Operation.GREATER_THAN_OR_EQUAL);
    }

    public static <T extends Comparable<T>> Filter<T> lessThan( T value) {
        return new Filter<>(value, Operation.LESS_THAN);
    }

    public static <T extends Comparable<T>> Filter<T> lessThanOrEqual(T value) {
        return new Filter<>(value, Operation.LESS_THAN_OR_EQUAL);
    }

    // ---------------- In-memory check ----------------

    /**
     * Check if a value satisfies this filter.
     */
    public boolean check(T valueToCheck) {
        Objects.requireNonNull(valueToCheck, "Value to check cannot be null");

        switch (operation) {
            case EQUAL: return valueToCheck.compareTo(value) == 0;
            case NOT_EQUAL: return valueToCheck.compareTo(value) != 0;
            case GREATER_THAN: return valueToCheck.compareTo(value) > 0;
            case GREATER_THAN_OR_EQUAL: return valueToCheck.compareTo(value) >= 0;
            case LESS_THAN: return valueToCheck.compareTo(value) < 0;
            case LESS_THAN_OR_EQUAL: return valueToCheck.compareTo(value) <= 0;
            default: throw new IllegalStateException("Unknown operation: " + operation);
        }
    }

    // ---------------- Getters ----------------
    public T getValue() { return value; }
    public Operation getOperation() { return operation; }
}

