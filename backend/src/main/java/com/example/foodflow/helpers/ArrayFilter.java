package com.example.foodflow.helpers;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Expression;

/**
 * Filter class for array/collection containment operations.
 * Checks if a target array contains elements according to the specified operation.
 * @param <T> Element type (must be Comparable)
 */
public class ArrayFilter<T extends Comparable<T>> implements Filter<Collection<T>> {

    /**
     * Supported operations for array containment filtering.
     */
    public enum Operation {
        CONTAINS_ALL,       // target array contains ALL filter values
        CONTAINS_ANY,       // target array contains ANY (at least one) filter value  
        CONTAINS_NONE,      // target array contains NONE of the filter values
        NOT_CONTAINS_ALL    // target array does NOT contain ALL filter values (missing at least one)
    }

    private final Set<T> filterValues;     // immutable set of values to check for
    private final Operation operation;     // operation type

    /**
     * Private constructor to enforce static factory methods usage.
     */
    protected ArrayFilter(Collection<T> values, Operation operation) {
        Objects.requireNonNull(values, "Filter values cannot be null");
        if (values.isEmpty()) {
            throw new IllegalArgumentException("Filter values cannot be empty");
        }
        
        // Validate no null values in the collection
        for (T value : values) {
            Objects.requireNonNull(value, "Individual filter values cannot be null");
        }
        
        this.filterValues = Collections.unmodifiableSet(new HashSet<>(values));
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
    }

    // ---------------- Static factory methods for varargs ----------------

    @SafeVarargs
    public static <T extends Comparable<T>> ArrayFilter<T> containsAll(T... values) {
        return new ArrayFilter<>(Arrays.asList(values), Operation.CONTAINS_ALL);
    }

    @SafeVarargs
    public static <T extends Comparable<T>> ArrayFilter<T> containsAny(T... values) {
        return new ArrayFilter<>(Arrays.asList(values), Operation.CONTAINS_ANY);
    }

    @SafeVarargs
    public static <T extends Comparable<T>> ArrayFilter<T> containsNone(T... values) {
        return new ArrayFilter<>(Arrays.asList(values), Operation.CONTAINS_NONE);
    }

    @SafeVarargs
    public static <T extends Comparable<T>> ArrayFilter<T> notContainsAll(T... values) {
        return new ArrayFilter<>(Arrays.asList(values), Operation.NOT_CONTAINS_ALL);
    }

    // ---------------- Static factory methods for collections ----------------

    public static <T extends Comparable<T>> ArrayFilter<T> containsAll(Collection<T> values) {
        return new ArrayFilter<>(values, Operation.CONTAINS_ALL);
    }

    public static <T extends Comparable<T>> ArrayFilter<T> containsAny(Collection<T> values) {
        return new ArrayFilter<>(values, Operation.CONTAINS_ANY);
    }

    public static <T extends Comparable<T>> ArrayFilter<T> containsNone(Collection<T> values) {
        return new ArrayFilter<>(values, Operation.CONTAINS_NONE);
    }

    public static <T extends Comparable<T>> ArrayFilter<T> notContainsAll(Collection<T> values) {
        return new ArrayFilter<>(values, Operation.NOT_CONTAINS_ALL);
    }

    // ---------------- In-memory check ----------------

    /**
     * Check if a target array/collection satisfies this filter.
     * @param targetArray the array/collection to check against
     */
    public boolean check(Collection<T> targetArray) {
        Objects.requireNonNull(targetArray, "Target array cannot be null");

        Set<T> targetSet = new HashSet<>(targetArray);

        switch (operation) {
            case CONTAINS_ALL:
                // Target must contain ALL filter values
                return targetSet.containsAll(filterValues);
                
            case CONTAINS_ANY:
                // Target must contain AT LEAST ONE filter value
                return filterValues.stream().anyMatch(targetSet::contains);
                
            case CONTAINS_NONE:
                // Target must contain NONE of the filter values
                return filterValues.stream().noneMatch(targetSet::contains);
                
            case NOT_CONTAINS_ALL:
                // Target must NOT contain ALL filter values (missing at least one)
                return !targetSet.containsAll(filterValues);
                
            default: 
                throw new IllegalStateException("Unknown operation: " + operation);
        }
    }

    @Override
    public <E> Specification<E> toSpecification(String fieldName) {
        return (root, query, cb) -> {
            Path<Collection<T>> arrayPath = root.get(fieldName);

            switch (operation) {
                case CONTAINS_ALL:
                    // All filter values must be in the array
                    return cb.and(
                        filterValues.stream()
                            .map(value -> cb.isMember(value, arrayPath))
                            .toArray(jakarta.persistence.criteria.Predicate[]::new)
                    );
                    
                case CONTAINS_ANY:
                    // At least one filter value must be in the array
                    return cb.or(
                        filterValues.stream()
                            .map(value -> cb.isMember(value, arrayPath))
                            .toArray(jakarta.persistence.criteria.Predicate[]::new)
                    );
                    
                case CONTAINS_NONE:
                    // None of the filter values should be in the array
                    return cb.and(
                        filterValues.stream()
                            .map(value -> cb.isNotMember(value, arrayPath))
                            .toArray(jakarta.persistence.criteria.Predicate[]::new)
                    );
                    
                case NOT_CONTAINS_ALL:
                    // Not all filter values are in the array (at least one is missing)
                    return cb.not(
                        cb.and(
                            filterValues.stream()
                                .map(value -> cb.isMember(value, arrayPath))
                                .toArray(jakarta.persistence.criteria.Predicate[]::new)
                        )
                    );
                    
                default: 
                    throw new IllegalStateException("Unknown operation: " + operation);
            }
        };
    }

    // ---------------- Getters ----------------
    
    /**
     * Returns an immutable copy of the filter values.
     */
    public Set<T> getFilterValues() { 
        return filterValues; // Already immutable from constructor
    }
    
    public Operation getOperation() { 
        return operation; 
    }

    // ---------------- Utility methods ----------------

    /**
     * Returns the number of filter values.
     */
    public int size() {
        return filterValues.size();
    }

    /**
     * Returns true if this filter contains the specified value.
     */
    public boolean containsFilterValue(T value) {
        return filterValues.contains(value);
    }

    // ---------------- Object methods ----------------

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        ArrayFilter<?> that = (ArrayFilter<?>) obj;
        return Objects.equals(filterValues, that.filterValues) && 
               operation == that.operation;
    }

    @Override
    public int hashCode() {
        return Objects.hash(filterValues, operation);
    }

    @Override
    public String toString() {
        return String.format("ArrayFilter{filterValues=%s, operation=%s}", filterValues, operation);
    }
}