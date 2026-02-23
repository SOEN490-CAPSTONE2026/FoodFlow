package com.example.foodflow.helpers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.data.jpa.domain.Specification;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;

@DisplayName("ArrayFilter Tests")
class ArrayFilterTest {

    @Nested
    @DisplayName("Constructor and Factory Methods")
    class ConstructorTests {

        @Test
        @DisplayName("Should create filter with varargs successfully")
        void shouldCreateFilterWithVarargs() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B", "C");
            
            assertNotNull(filter);
            assertEquals(3, filter.size());
            assertEquals(ArrayFilter.Operation.CONTAINS_ALL, filter.getOperation());
            assertTrue(filter.containsFilterValue("A"));
            assertTrue(filter.containsFilterValue("B"));
            assertTrue(filter.containsFilterValue("C"));
        }

        @Test
        @DisplayName("Should create filter with collection successfully")
        void shouldCreateFilterWithCollection() {
            List<String> values = Arrays.asList("X", "Y", "Z");
            ArrayFilter<String> filter = ArrayFilter.containsAny(values);
            
            assertNotNull(filter);
            assertEquals(3, filter.size());
            assertEquals(ArrayFilter.Operation.CONTAINS_ANY, filter.getOperation());
            assertTrue(filter.containsFilterValue("X"));
            assertTrue(filter.containsFilterValue("Y"));
            assertTrue(filter.containsFilterValue("Z"));
        }

        @Test
        @DisplayName("Should throw exception for null values")
        void shouldThrowExceptionForNullValues() {
            assertThrows(NullPointerException.class, () -> {
                ArrayFilter.containsAll((String[]) null);
            });
        }

        @Test
        @DisplayName("Should throw exception for empty values")
        void shouldThrowExceptionForEmptyValues() {
            assertThrows(IllegalArgumentException.class, () -> {
                ArrayFilter.containsAll();
            });
            
            assertThrows(IllegalArgumentException.class, () -> {
                ArrayFilter.containsAll(Collections.<String>emptyList());
            });
        }

        @Test
        @DisplayName("Should throw exception for null individual values")
        void shouldThrowExceptionForNullIndividualValues() {
            assertThrows(NullPointerException.class, () -> {
                ArrayFilter.containsAll("A", null, "C");
            });
        }

        @Test
        @DisplayName("Should handle duplicate values by removing them")
        void shouldHandleDuplicateValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B", "A", "B");
            
            assertEquals(2, filter.size()); // Duplicates removed
            assertTrue(filter.containsFilterValue("A"));
            assertTrue(filter.containsFilterValue("B"));
        }
    }

    @Nested
    @DisplayName("CONTAINS_ALL Operation")
    class ContainsAllTests {

        @Test
        @DisplayName("Should return true when target contains all filter values")
        void shouldReturnTrueWhenTargetContainsAllFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("FRUITS_VEGETABLES", "DAIRY_COLD");
            
            List<String> target = Arrays.asList("FRUITS_VEGETABLES", "DAIRY_COLD", "BAKERY_PASTRY");
            assertTrue(filter.check(target));
        }

        @Test
        @DisplayName("Should return true when target exactly matches filter values")
        void shouldReturnTrueWhenTargetExactlyMatchesFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            
            List<String> target = Arrays.asList("A", "B");
            assertTrue(filter.check(target));
        }

        @Test
        @DisplayName("Should return false when target is missing some filter values")
        void shouldReturnFalseWhenTargetMissingSomeFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("FRUITS_VEGETABLES", "DAIRY_COLD");
            
            List<String> target = Arrays.asList("FRUITS_VEGETABLES", "BAKERY_PASTRY");
            assertFalse(filter.check(target)); // Missing DAIRY_COLD
        }

        @Test
        @DisplayName("Should return false when target is empty")
        void shouldReturnFalseWhenTargetIsEmpty() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            
            assertFalse(filter.check(Collections.<String>emptyList()));
        }

        @Test
        @DisplayName("Should handle duplicate values in target array")
        void shouldHandleDuplicateValuesInTarget() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            
            List<String> target = Arrays.asList("A", "A", "B", "B", "C");
            assertTrue(filter.check(target));
        }
    }

    @Nested
    @DisplayName("CONTAINS_ANY Operation")
    class ContainsAnyTests {

        @Test
        @DisplayName("Should return true when target contains at least one filter value")
        void shouldReturnTrueWhenTargetContainsAtLeastOneFilterValue() {
            ArrayFilter<String> filter = ArrayFilter.containsAny("FRUITS_VEGETABLES", "DAIRY_COLD");
            
            List<String> target = Arrays.asList("FRUITS_VEGETABLES", "BAKERY_PASTRY");
            assertTrue(filter.check(target)); // Has FRUITS_VEGETABLES
        }

        @Test
        @DisplayName("Should return true when target contains all filter values")
        void shouldReturnTrueWhenTargetContainsAllFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAny("A", "B");
            
            List<String> target = Arrays.asList("A", "B", "C");
            assertTrue(filter.check(target));
        }

        @Test
        @DisplayName("Should return false when target contains none of the filter values")
        void shouldReturnFalseWhenTargetContainsNoneOfFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAny("FRUITS_VEGETABLES", "DAIRY_COLD");
            
            List<String> target = Arrays.asList("BAKERY_PASTRY", "FROZEN_FOOD");
            assertFalse(filter.check(target));
        }

        @Test
        @DisplayName("Should return false when target is empty")
        void shouldReturnFalseWhenTargetIsEmpty() {
            ArrayFilter<String> filter = ArrayFilter.containsAny("A", "B");
            
            assertFalse(filter.check(Collections.<String>emptyList()));
        }
    }

    @Nested
    @DisplayName("CONTAINS_NONE Operation")
    class ContainsNoneTests {

        @Test
        @DisplayName("Should return true when target contains none of the filter values")
        void shouldReturnTrueWhenTargetContainsNoneOfFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsNone("EXPIRED", "UNAVAILABLE");
            
            List<String> target = Arrays.asList("FRUITS_VEGETABLES", "DAIRY_COLD");
            assertTrue(filter.check(target));
        }

        @Test
        @DisplayName("Should return true when target is empty")
        void shouldReturnTrueWhenTargetIsEmpty() {
            ArrayFilter<String> filter = ArrayFilter.containsNone("A", "B");
            
            assertTrue(filter.check(Collections.<String>emptyList()));
        }

        @Test
        @DisplayName("Should return false when target contains any filter value")
        void shouldReturnFalseWhenTargetContainsAnyFilterValue() {
            ArrayFilter<String> filter = ArrayFilter.containsNone("EXPIRED", "UNAVAILABLE");
            
            List<String> target = Arrays.asList("FRUITS_VEGETABLES", "EXPIRED");
            assertFalse(filter.check(target)); // Contains EXPIRED
        }

        @Test
        @DisplayName("Should return false when target contains all filter values")
        void shouldReturnFalseWhenTargetContainsAllFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsNone("A", "B");
            
            List<String> target = Arrays.asList("A", "B", "C");
            assertFalse(filter.check(target));
        }
    }

    @Nested
    @DisplayName("NOT_CONTAINS_ALL Operation")
    class NotContainsAllTests {

        @Test
        @DisplayName("Should return true when target is missing at least one filter value")
        void shouldReturnTrueWhenTargetMissingAtLeastOneFilterValue() {
            ArrayFilter<String> filter = ArrayFilter.notContainsAll("PREMIUM", "ORGANIC");
            
            List<String> target = Arrays.asList("PREMIUM", "REGULAR");
            assertTrue(filter.check(target)); // Missing ORGANIC
        }

        @Test
        @DisplayName("Should return true when target is empty")
        void shouldReturnTrueWhenTargetIsEmpty() {
            ArrayFilter<String> filter = ArrayFilter.notContainsAll("A", "B");
            
            assertTrue(filter.check(Collections.<String>emptyList()));
        }

        @Test
        @DisplayName("Should return true when target contains none of the filter values")
        void shouldReturnTrueWhenTargetContainsNoneOfFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.notContainsAll("A", "B");
            
            List<String> target = Arrays.asList("C", "D");
            assertTrue(filter.check(target));
        }

        @Test
        @DisplayName("Should return false when target contains all filter values")
        void shouldReturnFalseWhenTargetContainsAllFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.notContainsAll("PREMIUM", "ORGANIC");
            
            List<String> target = Arrays.asList("PREMIUM", "ORGANIC", "LOCAL");
            assertFalse(filter.check(target)); // Has both PREMIUM and ORGANIC
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should throw exception when checking null target")
        void shouldThrowExceptionWhenCheckingNullTarget() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            
            assertThrows(NullPointerException.class, () -> {
                filter.check(null);
            });
        }

        @Test
        @DisplayName("Should work with single filter value")
        void shouldWorkWithSingleFilterValue() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("SINGLE");
            
            assertTrue(filter.check(Arrays.asList("SINGLE", "OTHER")));
            assertFalse(filter.check(Arrays.asList("OTHER")));
        }

        @Test
        @DisplayName("Should work with different comparable types")
        void shouldWorkWithDifferentComparableTypes() {
            ArrayFilter<Integer> filter = ArrayFilter.containsAny(1, 2, 3);
            
            assertTrue(filter.check(Arrays.asList(1, 4, 5)));
            assertFalse(filter.check(Arrays.asList(4, 5, 6)));
        }

        @Test
        @DisplayName("Should maintain case sensitivity for strings")
        void shouldMaintainCaseSensitivityForStrings() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("Apple", "Banana");
            
            assertFalse(filter.check(Arrays.asList("apple", "banana"))); // Different case
            assertTrue(filter.check(Arrays.asList("Apple", "Banana")));
        }
    }

    @Nested
    @DisplayName("Utility Methods")
    class UtilityMethodTests {

        @Test
        @DisplayName("Should return correct size")
        void shouldReturnCorrectSize() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B", "C");
            assertEquals(3, filter.size());
        }

        @Test
        @DisplayName("Should check if contains filter value")
        void shouldCheckIfContainsFilterValue() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B", "C");
            
            assertTrue(filter.containsFilterValue("A"));
            assertTrue(filter.containsFilterValue("B"));
            assertTrue(filter.containsFilterValue("C"));
            assertFalse(filter.containsFilterValue("D"));
        }

        @Test
        @DisplayName("Should return immutable filter values")
        void shouldReturnImmutableFilterValues() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            Set<String> values = filter.getFilterValues();
            
            assertThrows(UnsupportedOperationException.class, () -> {
                values.add("C");
            });
        }
    }

    @Nested
    @DisplayName("Object Methods")
    class ObjectMethodTests {

        @Test
        @DisplayName("Should implement equals correctly")
        void shouldImplementEqualsCorrectly() {
            ArrayFilter<String> filter1 = ArrayFilter.containsAll("A", "B");
            ArrayFilter<String> filter2 = ArrayFilter.containsAll("A", "B");
            ArrayFilter<String> filter3 = ArrayFilter.containsAll("A", "C");
            ArrayFilter<String> filter4 = ArrayFilter.containsAny("A", "B");
            
            assertEquals(filter1, filter2);
            assertNotEquals(filter1, filter3); // Different values
            assertNotEquals(filter1, filter4); // Different operation
            assertNotEquals(filter1, null);
            assertNotEquals(filter1, "not a filter");
        }

        @Test
        @DisplayName("Should implement hashCode correctly")
        void shouldImplementHashCodeCorrectly() {
            ArrayFilter<String> filter1 = ArrayFilter.containsAll("A", "B");
            ArrayFilter<String> filter2 = ArrayFilter.containsAll("A", "B");
            
            assertEquals(filter1.hashCode(), filter2.hashCode());
        }

        @Test
        @DisplayName("Should implement toString correctly")
        void shouldImplementToStringCorrectly() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            String toString = filter.toString();
            
            assertTrue(toString.contains("ArrayFilter"));
            assertTrue(toString.contains("CONTAINS_ALL"));
            assertTrue(toString.contains("A"));
            assertTrue(toString.contains("B"));
        }
    }

    @Nested
    @DisplayName("JPA Specification")
    class SpecificationTests {

        @Test
        @DisplayName("Should create specification without throwing exceptions")
        void shouldCreateSpecificationWithoutThrowingExceptions() {
            ArrayFilter<String> filter = ArrayFilter.containsAll("A", "B");
            
            assertDoesNotThrow(() -> {
                Specification<Object> spec = filter.toSpecification("testField");
                assertNotNull(spec);
            });
        }

        @Test
        @DisplayName("Should handle all operations in specification")
        void shouldHandleAllOperationsInSpecification() {
            assertDoesNotThrow(() -> {
                ArrayFilter.containsAll("A").toSpecification("field");
                ArrayFilter.containsAny("A").toSpecification("field");
                ArrayFilter.containsNone("A").toSpecification("field");
                ArrayFilter.notContainsAll("A").toSpecification("field");
            });
        }
    }

    @Nested
    @DisplayName("Real-World Scenarios")
    class RealWorldScenarioTests {

        @Test
        @DisplayName("Should work with food categories scenario")
        void shouldWorkWithFoodCategoriesScenario() {
            // Scenario: Find posts that have both fruits and vegetables AND dairy
            ArrayFilter<String> healthyFilter = ArrayFilter.containsAll(
                "FRUITS_VEGETABLES", "DAIRY_COLD"
            );
            
            List<String> healthyPost = Arrays.asList(
                "FRUITS_VEGETABLES", "DAIRY_COLD", "ORGANIC"
            );
            List<String> partiallyHealthy = Arrays.asList(
                "FRUITS_VEGETABLES", "BAKERY_PASTRY"
            );
            
            assertTrue(healthyFilter.check(healthyPost));
            assertFalse(healthyFilter.check(partiallyHealthy));
        }

        @Test
        @DisplayName("Should work with exclusion scenario")
        void shouldWorkWithExclusionScenario() {
            // Scenario: Exclude posts with problematic categories
            ArrayFilter<String> excludeFilter = ArrayFilter.containsNone(
                "EXPIRED", "RECALLED", "CONTAMINATED"
            );
            
            List<String> safePost = Arrays.asList("FRUITS_VEGETABLES", "ORGANIC");
            List<String> unsafePost = Arrays.asList("FRUITS_VEGETABLES", "EXPIRED");
            
            assertTrue(excludeFilter.check(safePost));
            assertFalse(excludeFilter.check(unsafePost));
        }

        @Test
        @DisplayName("Should work with flexible matching scenario")
        void shouldWorkWithFlexibleMatchingScenario() {
            // Scenario: Find posts that have any premium features
            ArrayFilter<String> premiumFilter = ArrayFilter.containsAny(
                "ORGANIC", "LOCAL", "PREMIUM", "ARTISAN"
            );
            
            List<String> organicPost = Arrays.asList("FRUITS_VEGETABLES", "ORGANIC");
            List<String> localPost = Arrays.asList("BAKERY_PASTRY", "LOCAL");
            List<String> regularPost = Arrays.asList("FRUITS_VEGETABLES", "REGULAR");
            
            assertTrue(premiumFilter.check(organicPost));
            assertTrue(premiumFilter.check(localPost));
            assertFalse(premiumFilter.check(regularPost));
        }
    }
}