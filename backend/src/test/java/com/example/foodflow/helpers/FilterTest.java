package com.example.foodflow.helpers;

import helpers.Filter;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FilterTest {

    // ---------------- Numeric filters ----------------

    @Test
    void testIntegerEqual() {
        Filter<Object, Integer> filter = Filter.equal("quantity", 10);
        assertTrue(filter.check(10));
        assertFalse(filter.check(5));
    }

    @Test
    void testIntegerNotEqual() {
        Filter<Object, Integer> filter = Filter.notEqual("quantity", 10);
        assertFalse(filter.check(10));
        assertTrue(filter.check(5));
    }

    @Test
    void testIntegerGreaterThan() {
        Filter<Object, Integer> filter = Filter.greaterThan("quantity", 10);
        assertTrue(filter.check(20));
        assertFalse(filter.check(5));
        assertFalse(filter.check(10));
    }

    @Test
    void testIntegerLessThanOrEqual() {
        Filter<Object, Integer> filter = Filter.lessThanOrEqual("quantity", 10);
        assertTrue(filter.check(5));
        assertTrue(filter.check(10));
        assertFalse(filter.check(15));
    }

    // ---------------- String filters ----------------

    @Test
    void testStringEqual() {
        Filter<Object, String> filter = Filter.equal("type", "Fruit");
        assertTrue(filter.check("Fruit"));
        assertFalse(filter.check("Vegetable"));
    }

    @Test
    void testStringNotEqual() {
        Filter<Object, String> filter = Filter.notEqual("type", "Fruit");
        assertFalse(filter.check("Fruit"));
        assertTrue(filter.check("Vegetable"));
    }

    // ---------------- Null checks ----------------

    @Test
    void testNullValueThrowsException() {
        assertThrows(NullPointerException.class, () -> Filter.equal("field", null));
    }

    @Test
    void testCheckWithNullThrowsException() {
        Filter<Object, String> filter = Filter.equal("field", "Value");
        assertThrows(NullPointerException.class, () -> filter.check(null));
    }
}

