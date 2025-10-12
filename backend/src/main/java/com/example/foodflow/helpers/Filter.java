package com.example.foodflow.helpers;

import org.springframework.data.jpa.domain.Specification;

/**
 * Interface for any filter.
 * @param <T> the type of the field being filtered
 */
public interface Filter<T> {

    /**
     * Checks if a given value satisfies this filter.
     * @param valueToCheck value to test
     * @return true if it passes the filter, false otherwise
     */
    boolean check(T valueToCheck);

    /**
     * Default: not all filters can be converted to a JPA Specification.
     */
    default <E> Specification<E> toSpecification(String fieldName) {
        throw new UnsupportedOperationException(
            "This filter does not support conversion to Specification"
        );
    }
}