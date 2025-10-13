package com.example.foodflow.helpers;


import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import helpers.CompositeFilter;
import helpers.BasicFilter;
//import helpers.StringFilter;

class CompositeFilterTest {

    @Test
    void testIntegerFiltersAllPass() {
        CompositeFilter<Integer> composite = new CompositeFilter<>();
        composite.add(BasicFilter.greaterThan(5))
                 .add(BasicFilter.lessThanOrEqual(10));

        assertTrue(composite.check(7)); // passes both filters
    }

    @Test
    void testIntegerFiltersOneFails() {
        CompositeFilter<Integer> composite = new CompositeFilter<>();
        composite.add(BasicFilter.greaterThan(5))
                 .add(BasicFilter.lessThanOrEqual(10));

        assertFalse(composite.check(4));  // fails greaterThan(5)
        assertFalse(composite.check(11)); // fails lessThanOrEqual(10)
    }

    /* 
    @Test
    void testStringFiltersAllPass() {
        CompositeFilter<String> composite = new CompositeFilter<>();
        composite.add(StringFilter.startsWith("A"))
                 .add(StringFilter.endsWith("e"))
                 .add(StringFilter.contains("lic"));

        assertTrue(composite.check("Alice"));
    }

    
    @Test
    void testStringFiltersOneFails() {
        CompositeFilter<String> composite = new CompositeFilter<>();
        composite.add(StringFilter.startsWith("A"))
                 .add(StringFilter.endsWith("e"))
                 .add(StringFilter.contains("lic"));

        assertFalse(composite.check("Alicia")); // doesn’t end with "e"
        assertFalse(composite.check("Bob"));    // fails all
    }
        */

    @Test
    void testEmptyCompositeFilter() {
        CompositeFilter<String> composite = new CompositeFilter<>();
        // No filters: should always pass
        assertTrue(composite.check("anything"));
    }

    /* 
    @Test
    void testNullValueThrows() {
        CompositeFilter<String> composite = new CompositeFilter<>();
        composite.add(StringFilter.contains("test"));

        assertThrows(NullPointerException.class, () -> composite.check(null));
    }
    */

    @Test
    void testAddMultipleFiltersWithVarargs() {
        CompositeFilter<Integer> composite = new CompositeFilter<>();
        composite.add(BasicFilter.greaterThan(0), BasicFilter.lessThan(100), BasicFilter.notEqual(50));

        assertTrue(composite.check(25));
        assertFalse(composite.check(50));
        assertFalse(composite.check(101));
    }
}
