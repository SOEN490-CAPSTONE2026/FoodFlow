package com.example.foodflow.helpers;


import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import helpers.Filter;

class FilterTest {

    @Test
    void testEqualOperation() {
        Filter<Integer> filter = Filter.equal(10);
        assertTrue(filter.check(10));
        assertFalse(filter.check(9));
    }

    @Test
    void testNotEqualOperation() {
        Filter<String> filter = Filter.notEqual("apple");
        assertTrue(filter.check("banana"));
        assertFalse(filter.check("apple"));
    }

    @Test
    void testGreaterThanOperation() {
        Filter<Integer> filter = Filter.greaterThan(5);
        assertTrue(filter.check(6));
        assertFalse(filter.check(5));
        assertFalse(filter.check(4));
    }

    @Test
    void testGreaterThanOrEqualOperation() {
        Filter<Double> filter = Filter.greaterThanOrEqual(2.5);
        assertTrue(filter.check(3.0));
        assertTrue(filter.check(2.5));
        assertFalse(filter.check(2.4));
    }

    @Test
    void testLessThanOperation() {
        Filter<Integer> filter = Filter.lessThan(10);
        assertTrue(filter.check(9));
        assertFalse(filter.check(10));
        assertFalse(filter.check(11));
    }

    @Test
    void testLessThanOrEqualOperation() {
        Filter<Integer> filter = Filter.lessThanOrEqual(10);
        assertTrue(filter.check(10));
        assertTrue(filter.check(9));
        assertFalse(filter.check(11));
    }

    @Test
    void testStringComparisonLexicographically() {
        Filter<String> filter = Filter.lessThan("mango");
        assertTrue(filter.check("apple"));   // "apple" < "mango"
        assertFalse(filter.check("zebra"));
    }

    @Test
    void testNullValueThrows() {
        Filter<Integer> filter = Filter.equal(5);
        assertThrows(NullPointerException.class, () -> filter.check(null));
    }

    @Test
    void testGetters() {
        Filter<Integer> filter = Filter.greaterThan(7);
        assertEquals(7, filter.getValue());
        assertEquals(Filter.Operation.GREATER_THAN, filter.getOperation());
    }
}

