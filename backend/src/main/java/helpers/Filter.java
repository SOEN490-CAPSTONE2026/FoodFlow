package helpers;


import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Path;
import java.util.Objects;

/**
 * Generic filter class for any JPA entity.
 *
 * @param <E> Entity type
 * @param <T> Field type (must be Comparable)
 */
public class Filter<E, T extends Comparable<T>> {

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

    private final String fieldName; // entity field to filter
    private final T value;          // value to compare against
    private final Operation operation; // operation type

    /**
     * Private constructor to enforce static factory methods usage.
     */
    protected Filter(String fieldName, T value, Operation operation) {
        this.fieldName = Objects.requireNonNull(fieldName, "Field name cannot be null");
        this.value = Objects.requireNonNull(value, "Filter value cannot be null");
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
    }

    // ---------------- Static factory methods ----------------

    public static <E, T extends Comparable<T>> Filter<E, T> equal(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.EQUAL);
    }

    public static <E, T extends Comparable<T>> Filter<E, T> notEqual(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.NOT_EQUAL);
    }

    public static <E, T extends Comparable<T>> Filter<E, T> greaterThan(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.GREATER_THAN);
    }

    public static <E, T extends Comparable<T>> Filter<E, T> greaterThanOrEqual(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.GREATER_THAN_OR_EQUAL);
    }

    public static <E, T extends Comparable<T>> Filter<E, T> lessThan(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.LESS_THAN);
    }

    public static <E, T extends Comparable<T>> Filter<E, T> lessThanOrEqual(String fieldName, T value) {
        return new Filter<>(fieldName, value, Operation.LESS_THAN_OR_EQUAL);
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

    // ---------------- Specification integration ----------------

    /**
     * Convert this filter to a Spring Data JPA Specification.
     */
    public Specification<E> toSpecification() {
        return (root, query, cb) -> {
            Path<T> path = root.get(fieldName);

            switch (operation) {
                case EQUAL: return cb.equal(path, value);
                case NOT_EQUAL: return cb.notEqual(path, value);
                case GREATER_THAN: return cb.greaterThan(path, value);
                case GREATER_THAN_OR_EQUAL: return cb.greaterThanOrEqualTo(path, value);
                case LESS_THAN: return cb.lessThan(path, value);
                case LESS_THAN_OR_EQUAL: return cb.lessThanOrEqualTo(path, value);
                default: throw new IllegalStateException("Unknown operation: " + operation);
            }
        };
    }

    // ---------------- Getters ----------------

    public String getFieldName() { return fieldName; }
    public T getValue() { return value; }
    public Operation getOperation() { return operation; }
}

