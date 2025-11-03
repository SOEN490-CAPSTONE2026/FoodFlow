package com.example.foodflow.helpers;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Utility class for combining and manipulating JPA Specifications.
 * Provides static methods for common specification operations.
 */
public class SpecificationHandler {

    private SpecificationHandler() {
        // Utility class - prevent instantiation
        throw new UnsupportedOperationException("SpecificationHandler is a utility class and cannot be instantiated");
    }

    // ---------------- AND Operations ----------------

    /**
     * Combines multiple specifications using AND logic (varargs).
     * Returns a specification that matches entities satisfying ALL provided specifications.
     * 
     * @param <T> the entity type
     * @param specifications the specifications to combine
     * @return combined specification using AND logic, or null if no specifications provided
     */
    @SafeVarargs
    public static <T> Specification<T> and(Specification<T>... specifications) {
        return and(Arrays.asList(specifications));
    }

    /**
     * Combines multiple specifications using AND logic (collection).
     * Returns a specification that matches entities satisfying ALL provided specifications.
     * 
     * @param <T> the entity type
     * @param specifications the specifications to combine
     * @return combined specification using AND logic, or null if no specifications provided
     */
    public static <T> Specification<T> and(Collection<Specification<T>> specifications) {
        if (specifications == null || specifications.isEmpty()) {
            return null;
        }

        List<Specification<T>> nonNullSpecs = specifications.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        if (nonNullSpecs.isEmpty()) {
            return null;
        }

        return nonNullSpecs.stream()
            .reduce(Specification::and)
            .orElse(null);
    }

    // ---------------- OR Operations ----------------

    /**
     * Combines multiple specifications using OR logic (varargs).
     * Returns a specification that matches entities satisfying ANY of the provided specifications.
     * 
     * @param <T> the entity type
     * @param specifications the specifications to combine
     * @return combined specification using OR logic, or null if no specifications provided
     */
    @SafeVarargs
    public static <T> Specification<T> or(Specification<T>... specifications) {
        return or(Arrays.asList(specifications));
    }

    /**
     * Combines multiple specifications using OR logic (collection).
     * Returns a specification that matches entities satisfying ANY of the provided specifications.
     * 
     * @param <T> the entity type
     * @param specifications the specifications to combine
     * @return combined specification using OR logic, or null if no specifications provided
     */
    public static <T> Specification<T> or(Collection<Specification<T>> specifications) {
        if (specifications == null || specifications.isEmpty()) {
            return null;
        }

        List<Specification<T>> nonNullSpecs = specifications.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        if (nonNullSpecs.isEmpty()) {
            return null;
        }

        return nonNullSpecs.stream()
            .reduce(Specification::or)
            .orElse(null);
    }

    // ---------------- NOT Operations ----------------

    /**
     * Negates a specification using NOT logic.
     * Returns a specification that matches entities NOT satisfying the provided specification.
     * 
     * @param <T> the entity type
     * @param specification the specification to negate
     * @return negated specification, or null if input specification is null
     */
    public static <T> Specification<T> not(Specification<T> specification) {
        if (specification == null) {
            return null;
        }
        return Specification.not(specification);
    }

    // ---------------- Complex Combinations ----------------

    /**
     * Combines specifications with mixed AND/OR logic.
     * First combines each group with OR, then combines all groups with AND.
     * 
     * Example: (spec1 OR spec2) AND (spec3 OR spec4) AND spec5
     * 
     * @param <T> the entity type
     * @param specificationGroups groups of specifications to combine
     * @return combined specification
     */
    @SafeVarargs
    public static <T> Specification<T> andOfOrs(Collection<Specification<T>>... specificationGroups) {
        if (specificationGroups == null || specificationGroups.length == 0) {
            return null;
        }

        List<Specification<T>> orSpecs = Arrays.stream(specificationGroups)
            .map(SpecificationHandler::or)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return and(orSpecs);
    }

    /**
     * Combines specifications with mixed OR/AND logic.
     * First combines each group with AND, then combines all groups with OR.
     * 
     * Example: (spec1 AND spec2) OR (spec3 AND spec4) OR spec5
     * 
     * @param <T> the entity type
     * @param specificationGroups groups of specifications to combine
     * @return combined specification
     */
    @SafeVarargs
    public static <T> Specification<T> orOfAnds(Collection<Specification<T>>... specificationGroups) {
        if (specificationGroups == null || specificationGroups.length == 0) {
            return null;
        }

        List<Specification<T>> andSpecs = Arrays.stream(specificationGroups)
            .map(SpecificationHandler::and)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return or(andSpecs);
    }

    // ---------------- Conditional Operations ----------------

    /**
     * Conditionally adds a specification to an existing one using AND logic.
     * 
     * @param <T> the entity type
     * @param baseSpec the base specification (can be null)
     * @param condition the condition to check
     * @param specToAdd the specification to add if condition is true
     * @return combined specification if condition is true, otherwise returns baseSpec
     */
    public static <T> Specification<T> andIf(Specification<T> baseSpec, boolean condition, Specification<T> specToAdd) {
        if (!condition || specToAdd == null) {
            return baseSpec;
        }
        return baseSpec == null ? specToAdd : baseSpec.and(specToAdd);
    }

    /**
     * Conditionally adds a specification to an existing one using OR logic.
     * 
     * @param <T> the entity type
     * @param baseSpec the base specification (can be null)
     * @param condition the condition to check
     * @param specToAdd the specification to add if condition is true
     * @return combined specification if condition is true, otherwise returns baseSpec
     */
    public static <T> Specification<T> orIf(Specification<T> baseSpec, boolean condition, Specification<T> specToAdd) {
        if (!condition || specToAdd == null) {
            return baseSpec;
        }
        return baseSpec == null ? specToAdd : baseSpec.or(specToAdd);
    }

    // ---------------- Utility Operations ----------------

    /**
     * Creates a specification that always returns true (matches all entities).
     * 
     * @param <T> the entity type
     * @return specification that matches all entities
     */
    public static <T> Specification<T> alwaysTrue() {
        return (root, query, cb) -> cb.conjunction();
    }

    /**
     * Creates a specification that always returns false (matches no entities).
     * 
     * @param <T> the entity type
     * @return specification that matches no entities
     */
    public static <T> Specification<T> alwaysFalse() {
        return (root, query, cb) -> cb.disjunction();
    }

    /**
     * Checks if a specification is effectively null or empty.
     * 
     * @param specification the specification to check
     * @return true if specification is null, false otherwise
     */
    public static boolean isEmpty(Specification<?> specification) {
        return specification == null;
    }

    /**
     * Returns the first non-null specification from the provided specifications.
     * 
     * @param <T> the entity type
     * @param specifications the specifications to check
     * @return first non-null specification, or null if all are null
     */
    @SafeVarargs
    public static <T> Specification<T> firstNonNull(Specification<T>... specifications) {
        if (specifications == null) {
            return null;
        }
        
        return Arrays.stream(specifications)
            .filter(Objects::nonNull)
            .findFirst()
            .orElse(null);
    }

    // ---------------- Building Operations ----------------

    /**
     * Builder pattern for incrementally building complex specifications.
     * 
     * @param <T> the entity type
     * @return new SpecificationBuilder instance
     */
    public static <T> SpecificationBuilder<T> builder() {
        return new SpecificationBuilder<>();
    }

    /**
     * Builder class for incrementally constructing complex specifications.
     * 
     * @param <T> the entity type
     */
    public static class SpecificationBuilder<T> {
        private Specification<T> specification;

        private SpecificationBuilder() {
            this.specification = null;
        }

        /**
         * Adds a specification using AND logic.
         * 
         * @param spec the specification to add
         * @return this builder for method chaining
         */
        public SpecificationBuilder<T> and(Specification<T> spec) {
            if (spec != null) {
                this.specification = SpecificationHandler.andIf(this.specification, true, spec);
            }
            return this;
        }

        /**
         * Adds a specification using OR logic.
         * 
         * @param spec the specification to add
         * @return this builder for method chaining
         */
        public SpecificationBuilder<T> or(Specification<T> spec) {
            if (spec != null) {
                this.specification = SpecificationHandler.orIf(this.specification, true, spec);
            }
            return this;
        }

        /**
         * Conditionally adds a specification using AND logic.
         * 
         * @param condition the condition to check
         * @param spec the specification to add if condition is true
         * @return this builder for method chaining
         */
        public SpecificationBuilder<T> andIf(boolean condition, Specification<T> spec) {
            if (condition && spec != null) {
                this.specification = SpecificationHandler.andIf(this.specification, true, spec);
            }
            return this;
        }

        /**
         * Conditionally adds a specification using OR logic.
         * 
         * @param condition the condition to check
         * @param spec the specification to add if condition is true
         * @return this builder for method chaining
         */
        public SpecificationBuilder<T> orIf(boolean condition, Specification<T> spec) {
            if (condition && spec != null) {
                this.specification = SpecificationHandler.orIf(this.specification, true, spec);
            }
            return this;
        }

        /**
         * Builds and returns the final specification.
         * 
         * @return the constructed specification, or null if no specifications were added
         */
        public Specification<T> build() {
            return this.specification;
        }

        /**
         * Builds and returns the final specification, or a default if none were added.
         * 
         * @param defaultSpec the default specification to return if none were added
         * @return the constructed specification, or defaultSpec if none were added
         */
        public Specification<T> buildOrDefault(Specification<T> defaultSpec) {
            return this.specification != null ? this.specification : defaultSpec;
        }
    }
}