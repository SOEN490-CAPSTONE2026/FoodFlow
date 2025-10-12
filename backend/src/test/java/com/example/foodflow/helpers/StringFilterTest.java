package com.example.foodflow.helpers;

/* 
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import helpers.StringFilter;

class StringFilterTest {

    @Test
    void testEqual() {
        StringFilter f = StringFilter.equal("hello");
        assertTrue(f.check("hello"));
        assertFalse(f.check("Hello"));
        assertFalse(f.check("world"));
    }

    @Test
    void testNotEqual() {
        StringFilter f = StringFilter.notEqual("hello");
        assertTrue(f.check("world"));
        assertFalse(f.check("hello"));
    }

    @Test
    void testGreaterThan() {
        StringFilter f = StringFilter.greaterThan("apple");
        assertTrue(f.check("banana"));
        assertFalse(f.check("apple"));
        assertFalse(f.check("aardvark"));
    }

    @Test
    void testGreaterThanOrEqual() {
        StringFilter f = StringFilter.greaterThanOrEqual("apple");
        assertTrue(f.check("banana"));
        assertTrue(f.check("apple"));
        assertFalse(f.check("aardvark"));
    }

    @Test
    void testLessThan() {
        StringFilter f = StringFilter.lessThan("mango");
        assertTrue(f.check("apple"));
        assertFalse(f.check("mango"));
        assertFalse(f.check("zebra"));
    }

    @Test
    void testLessThanOrEqual() {
        StringFilter f = StringFilter.lessThanOrEqual("mango");
        assertTrue(f.check("apple"));
        assertTrue(f.check("mango"));
        assertFalse(f.check("zebra"));
    }

    // ----------- String-specific operations -----------

    @Test
    void testContains() {
        StringFilter f = StringFilter.contains("doe");
        assertTrue(f.check("john.doe"));
        assertFalse(f.check("jane.smith"));
    }

    @Test
    void testNotContains() {
        StringFilter f = StringFilter.notContains("admin");
        assertTrue(f.check("user123"));
        assertFalse(f.check("adminUser"));
    }

    @Test
    void testStartsWith() {
        StringFilter f = StringFilter.startsWith("A");
        assertTrue(f.check("Alice"));
        assertFalse(f.check("Bob"));
    }

    @Test
    void testEndsWith() {
        StringFilter f = StringFilter.endsWith(".com");
        assertTrue(f.check("example.com"));
        assertFalse(f.check("example.org"));
    }

    @Test
    void testMatches() {
        StringFilter f = StringFilter.matches("\\d{3}-\\d{2}-\\d{4}");
        assertTrue(f.check("123-45-6789"));
        assertFalse(f.check("123-456-789"));
    }

    @Test
    void testNullValueToCheck() {
        StringFilter f = StringFilter.equal("hello");
        assertThrows(NullPointerException.class, () -> f.check(null));
    }
}
*/