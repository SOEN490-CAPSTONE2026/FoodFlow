package com.example.foodflow.helpers;


import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import helpers.BasicFilter;

class BasicFilterTest {

    @Test
    void testEqualOperation() {
        BasicFilter<Integer> filter = BasicFilter.equal(10);
        assertTrue(filter.check(10));
        assertFalse(filter.check(9));
    }

    @Test
    void testNotEqualOperation() {
        BasicFilter<String> filter = BasicFilter.notEqual("apple");
        assertTrue(filter.check("banana"));
        assertFalse(filter.check("apple"));
    }

    @Test
    void testGreaterThanOperation() {
        BasicFilter<Integer> filter = BasicFilter.greaterThan(5);
        assertTrue(filter.check(6));
        assertFalse(filter.check(5));
        assertFalse(filter.check(4));
    }

    @Test
    void testGreaterThanOrEqualOperation() {
        BasicFilter<Double> filter = BasicFilter.greaterThanOrEqual(2.5);
        assertTrue(filter.check(3.0));
        assertTrue(filter.check(2.5));
        assertFalse(filter.check(2.4));
    }

    @Test
    void testLessThanOperation() {
        BasicFilter<Integer> filter = BasicFilter.lessThan(10);
        assertTrue(filter.check(9));
        assertFalse(filter.check(10));
        assertFalse(filter.check(11));
    }

    @Test
    void testLessThanOrEqualOperation() {
        BasicFilter<Integer> filter = BasicFilter.lessThanOrEqual(10);
        assertTrue(filter.check(10));
        assertTrue(filter.check(9));
        assertFalse(filter.check(11));
    }

    @Test
    void testStringComparisonLexicographically() {
        BasicFilter<String> filter = BasicFilter.lessThan("mango");
        assertTrue(filter.check("apple"));   // "apple" < "mango"
        assertFalse(filter.check("zebra"));
    }

    @Test
    void testNullValueThrows() {
        BasicFilter<Integer> filter = BasicFilter.equal(5);
        assertThrows(NullPointerException.class, () -> filter.check(null));
    }

    @Test
    void testGetters() {
        BasicFilter<Integer> filter = BasicFilter.greaterThan(7);
        assertEquals(7, filter.getValue());
        assertEquals(BasicFilter.Operation.GREATER_THAN, filter.getOperation());
    }
}

