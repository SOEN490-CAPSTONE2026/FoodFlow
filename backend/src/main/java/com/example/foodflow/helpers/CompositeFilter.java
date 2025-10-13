package com.example.foodflow.helpers;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Complex filter composed of atomic filters.
 * @param <T> the type of the field being filtered
 */
public class CompositeFilter<T> implements Filter<T>{

    private final List<Filter<T>> filters;

    public CompositeFilter() {
        filters = new ArrayList<>();
    }

    private void add(Filter<T> filter) {
        Objects.requireNonNull(filter, "Filter cannot be null");
        filters.add(filter);
    }

    @SafeVarargs
    public final CompositeFilter<T> add(Filter<T>... filters) {
        for (Filter<T> filter : filters){
            add(filter);
        }
        return this;
    }

    public boolean check(T value) {
        Objects.requireNonNull(value, "Value to check cannot be null");
        for (Filter<T> filter : filters) {
            if (!filter.check(value)) {
                return false; // fail fast
            }
        }
        return true; // all filters passed
    }

    public int size() {
        return filters.size();
    }
}
