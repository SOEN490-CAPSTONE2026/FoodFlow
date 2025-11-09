package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SpecificationHandler Tests")
class SpecificationHandlerTest {

    private Specification<Object> spec1;
    private Specification<Object> spec2;
    private Specification<Object> spec3;
    private Specification<Object> spec4;

    @BeforeEach
    void setUp() {
        // Create real specifications using lambda expressions - these work perfectly with your implementation
        spec1 = (root, query, cb) -> cb.conjunction();
        spec2 = (root, query, cb) -> cb.conjunction(); 
        spec3 = (root, query, cb) -> cb.conjunction();
        spec4 = (root, query, cb) -> cb.conjunction();
    }

    @Nested
    @DisplayName("Constructor and Utility Class Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should prevent instantiation as utility class")
        void shouldPreventInstantiation() throws Exception {
            Constructor<SpecificationHandler> constructor = SpecificationHandler.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            
            InvocationTargetException exception = assertThrows(InvocationTargetException.class, () -> {
                constructor.newInstance();
            });
            
            assertTrue(exception.getCause() instanceof UnsupportedOperationException);
            assertTrue(exception.getCause().getMessage().contains("utility class"));
            assertTrue(exception.getCause().getMessage().contains("cannot be instantiated"));
        }
    }

    @Nested
    @DisplayName("AND Operations")
    class AndOperationsTests {

        @Test
        @DisplayName("Should combine specifications using AND with varargs")
        void shouldCombineSpecificationsUsingAndWithVarargs() {
            Specification<Object> result = SpecificationHandler.and(spec1, spec2, spec3);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should combine specifications using AND with collection")
        void shouldCombineSpecificationsUsingAndWithCollection() {
            List<Specification<Object>> specs = Arrays.asList(spec1, spec2, spec3);
            Specification<Object> result = SpecificationHandler.and(specs);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null for empty specifications array")
        void shouldReturnNullForEmptySpecificationsArray() {
            @SuppressWarnings("unchecked")
            Specification<Object> result = SpecificationHandler.and();
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should return null for null specifications collection")
        void shouldReturnNullForNullSpecificationsCollection() {
            Specification<Object> result = SpecificationHandler.and((List<Specification<Object>>) null);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should return null for empty specifications collection")
        void shouldReturnNullForEmptySpecificationsCollection() {
            Specification<Object> result = SpecificationHandler.and(Collections.emptyList());
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should filter out null specifications in AND operation")
        void shouldFilterOutNullSpecificationsInAndOperation() {
            List<Specification<Object>> specs = Arrays.asList(spec1, null, spec2, null, spec3);
            Specification<Object> result = SpecificationHandler.and(specs);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null when all specifications are null")
        void shouldReturnNullWhenAllSpecificationsAreNull() {
            List<Specification<Object>> specs = Arrays.asList(null, null, null);
            Specification<Object> result = SpecificationHandler.and(specs);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle single specification in AND operation")
        void shouldHandleSingleSpecificationInAndOperation() {
            Specification<Object> result = SpecificationHandler.and(spec1);
            
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("OR Operations")
    class OrOperationsTests {

        @Test
        @DisplayName("Should combine specifications using OR with varargs")
        void shouldCombineSpecificationsUsingOrWithVarargs() {
            Specification<Object> result = SpecificationHandler.or(spec1, spec2, spec3);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should combine specifications using OR with collection")
        void shouldCombineSpecificationsUsingOrWithCollection() {
            List<Specification<Object>> specs = Arrays.asList(spec1, spec2, spec3);
            Specification<Object> result = SpecificationHandler.or(specs);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null for empty specifications array in OR")
        void shouldReturnNullForEmptySpecificationsArrayInOr() {
            @SuppressWarnings("unchecked")
            Specification<Object> result = SpecificationHandler.or();
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should return null for null specifications collection in OR")
        void shouldReturnNullForNullSpecificationsCollectionInOr() {
            Specification<Object> result = SpecificationHandler.or((List<Specification<Object>>) null);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should return null for empty specifications collection in OR")
        void shouldReturnNullForEmptySpecificationsCollectionInOr() {
            Specification<Object> result = SpecificationHandler.or(Collections.emptyList());
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should filter out null specifications in OR operation")
        void shouldFilterOutNullSpecificationsInOrOperation() {
            List<Specification<Object>> specs = Arrays.asList(spec1, null, spec2, null, spec3);
            Specification<Object> result = SpecificationHandler.or(specs);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null when all specifications are null in OR")
        void shouldReturnNullWhenAllSpecificationsAreNullInOr() {
            List<Specification<Object>> specs = Arrays.asList(null, null, null);
            Specification<Object> result = SpecificationHandler.or(specs);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle single specification in OR operation")
        void shouldHandleSingleSpecificationInOrOperation() {
            Specification<Object> result = SpecificationHandler.or(spec1);
            
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("NOT Operations")
    class NotOperationsTests {

        @Test
        @DisplayName("Should negate specification using NOT")
        void shouldNegateSpecificationUsingNot() {
            Specification<Object> result = SpecificationHandler.not(spec1);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null for null specification in NOT")
        void shouldReturnNullForNullSpecificationInNot() {
            Specification<Object> result = SpecificationHandler.not(null);
            
            assertNull(result);
        }
    }

    @Nested
    @DisplayName("Complex Combinations")
    class ComplexCombinationsTests {

        @Test
        @DisplayName("Should combine specifications with andOfOrs")
        void shouldCombineSpecificationsWithAndOfOrs() {
            List<Specification<Object>> group1 = Arrays.asList(spec1, spec2);
            List<Specification<Object>> group2 = Arrays.asList(spec3, spec4);
            
            Specification<Object> result = SpecificationHandler.andOfOrs(group1, group2);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle null groups in andOfOrs")
        void shouldHandleNullGroupsInAndOfOrs() {
            @SuppressWarnings("unchecked")
            List<Specification<Object>>[] groups = null;
            Specification<Object> result = SpecificationHandler.andOfOrs(groups);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle empty groups array in andOfOrs")
        void shouldHandleEmptyGroupsArrayInAndOfOrs() {
            @SuppressWarnings("unchecked")
            Specification<Object> result = SpecificationHandler.andOfOrs();
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should filter null groups in andOfOrs")
        void shouldFilterNullGroupsInAndOfOrs() {
            List<Specification<Object>> group1 = Arrays.asList(spec1, spec2);
            List<Specification<Object>> nullGroup = null;
            List<Specification<Object>> emptyGroup = Collections.emptyList();
            List<Specification<Object>> group2 = Arrays.asList(spec3, spec4);
            
            Specification<Object> result = SpecificationHandler.andOfOrs(group1, nullGroup, emptyGroup, group2);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should combine specifications with orOfAnds")
        void shouldCombineSpecificationsWithOrOfAnds() {
            List<Specification<Object>> group1 = Arrays.asList(spec1, spec2);
            List<Specification<Object>> group2 = Arrays.asList(spec3, spec4);
            
            Specification<Object> result = SpecificationHandler.orOfAnds(group1, group2);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle null groups in orOfAnds")
        void shouldHandleNullGroupsInOrOfAnds() {
            @SuppressWarnings("unchecked")
            List<Specification<Object>>[] groups = null;
            Specification<Object> result = SpecificationHandler.orOfAnds(groups);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle empty groups array in orOfAnds")
        void shouldHandleEmptyGroupsArrayInOrOfAnds() {
            @SuppressWarnings("unchecked")
            Specification<Object> result = SpecificationHandler.orOfAnds();
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should filter null groups in orOfAnds")
        void shouldFilterNullGroupsInOrOfAnds() {
            List<Specification<Object>> group1 = Arrays.asList(spec1, spec2);
            List<Specification<Object>> nullGroup = null;
            List<Specification<Object>> emptyGroup = Collections.emptyList();
            List<Specification<Object>> group2 = Arrays.asList(spec3, spec4);
            
            Specification<Object> result = SpecificationHandler.orOfAnds(group1, nullGroup, emptyGroup, group2);
            
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("Conditional Operations")
    class ConditionalOperationsTests {

        @Test
        @DisplayName("Should conditionally add specification with andIf when condition is true")
        void shouldConditionallyAddSpecificationWithAndIfWhenConditionIsTrue() {
            Specification<Object> result = SpecificationHandler.andIf(spec1, true, spec2);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should not add specification with andIf when condition is false")
        void shouldNotAddSpecificationWithAndIfWhenConditionIsFalse() {
            Specification<Object> result = SpecificationHandler.andIf(spec1, false, spec2);
            
            assertEquals(spec1, result);
        }

        @Test
        @DisplayName("Should handle null base spec in andIf")
        void shouldHandleNullBaseSpecInAndIf() {
            Specification<Object> result = SpecificationHandler.andIf(null, true, spec2);
            
            assertEquals(spec2, result);
        }

        @Test
        @DisplayName("Should handle null spec to add in andIf")
        void shouldHandleNullSpecToAddInAndIf() {
            Specification<Object> result = SpecificationHandler.andIf(spec1, true, null);
            
            assertEquals(spec1, result);
        }

        @Test
        @DisplayName("Should return null when both specs are null in andIf")
        void shouldReturnNullWhenBothSpecsAreNullInAndIf() {
            Specification<Object> result = SpecificationHandler.andIf(null, false, null);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should conditionally add specification with orIf when condition is true")
        void shouldConditionallyAddSpecificationWithOrIfWhenConditionIsTrue() {
            Specification<Object> result = SpecificationHandler.orIf(spec1, true, spec2);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should not add specification with orIf when condition is false")
        void shouldNotAddSpecificationWithOrIfWhenConditionIsFalse() {
            Specification<Object> result = SpecificationHandler.orIf(spec1, false, spec2);
            
            assertEquals(spec1, result);
        }

        @Test
        @DisplayName("Should handle null base spec in orIf")
        void shouldHandleNullBaseSpecInOrIf() {
            Specification<Object> result = SpecificationHandler.orIf(null, true, spec2);
            
            assertEquals(spec2, result);
        }

        @Test
        @DisplayName("Should handle null spec to add in orIf")
        void shouldHandleNullSpecToAddInOrIf() {
            Specification<Object> result = SpecificationHandler.orIf(spec1, true, null);
            
            assertEquals(spec1, result);
        }

        @Test
        @DisplayName("Should return null when both specs are null in orIf")
        void shouldReturnNullWhenBothSpecsAreNullInOrIf() {
            Specification<Object> result = SpecificationHandler.orIf(null, false, null);
            
            assertNull(result);
        }
    }

    @Nested
    @DisplayName("Utility Operations")
    class UtilityOperationsTests {

        @Test
        @DisplayName("Should create alwaysTrue specification")
        void shouldCreateAlwaysTrueSpecification() {
            Specification<Object> result = SpecificationHandler.alwaysTrue();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should create alwaysFalse specification")
        void shouldCreateAlwaysFalseSpecification() {
            Specification<Object> result = SpecificationHandler.alwaysFalse();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should check isEmpty correctly")
        void shouldCheckIsEmptyCorrectly() {
            assertTrue(SpecificationHandler.isEmpty(null));
            assertFalse(SpecificationHandler.isEmpty(spec1));
        }

        @Test
        @DisplayName("Should return first non-null specification")
        void shouldReturnFirstNonNullSpecification() {
            Specification<Object> result = SpecificationHandler.firstNonNull(null, null, spec2, spec3);
            
            assertEquals(spec2, result);
        }

        @Test
        @DisplayName("Should return null when all specifications are null in firstNonNull")
        void shouldReturnNullWhenAllSpecificationsAreNullInFirstNonNull() {
            Specification<Object> result = SpecificationHandler.firstNonNull(null, null, null);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle null array in firstNonNull")
        void shouldHandleNullArrayInFirstNonNull() {
            Specification<Object> result = SpecificationHandler.firstNonNull((Specification<Object>[]) null);
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should handle empty array in firstNonNull")
        void shouldHandleEmptyArrayInFirstNonNull() {
            @SuppressWarnings("unchecked")
            Specification<Object> result = SpecificationHandler.firstNonNull();
            
            assertNull(result);
        }
    }

    @Nested
    @DisplayName("Builder Pattern")
    class BuilderTests {

        @Test
        @DisplayName("Should create builder instance")
        void shouldCreateBuilderInstance() {
            SpecificationHandler.SpecificationBuilder<Object> builder = SpecificationHandler.builder();
            
            assertNotNull(builder);
        }

        @Test
        @DisplayName("Should build specification with AND operations")
        void shouldBuildSpecificationWithAndOperations() {
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec1)
                .and(spec2)
                .and(spec3)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should build specification with OR operations")
        void shouldBuildSpecificationWithOrOperations() {
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .or(spec1)
                .or(spec2)
                .or(spec3)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should build specification with mixed operations")
        void shouldBuildSpecificationWithMixedOperations() {
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec1)
                .or(spec2)
                .and(spec3)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should build specification with conditional operations")
        void shouldBuildSpecificationWithConditionalOperations() {
            boolean condition1 = true;
            boolean condition2 = false;
            
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec1)
                .andIf(condition1, spec2)
                .orIf(condition2, spec3)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should return null for empty builder")
        void shouldReturnNullForEmptyBuilder() {
            Specification<Object> result = SpecificationHandler.<Object>builder().build();
            
            assertNull(result);
        }

        @Test
        @DisplayName("Should ignore null specifications in builder")
        void shouldIgnoreNullSpecificationsInBuilder() {
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(null)
                .or(spec1)
                .and(null)
                .or(spec2)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle buildOrDefault with null result")
        void shouldHandleBuildOrDefaultWithNullResult() {
            Specification<Object> defaultSpec = spec1;
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .buildOrDefault(defaultSpec);
            
            assertEquals(defaultSpec, result);
        }

        @Test
        @DisplayName("Should handle buildOrDefault with non-null result")
        void shouldHandleBuildOrDefaultWithNonNullResult() {
            Specification<Object> defaultSpec = spec1;
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec2)
                .buildOrDefault(defaultSpec);
            
            assertNotNull(result);
            assertNotEquals(defaultSpec, result);
        }

        @Test
        @DisplayName("Should handle method chaining correctly")
        void shouldHandleMethodChainingCorrectly() {
            SpecificationHandler.SpecificationBuilder<Object> builder = SpecificationHandler.<Object>builder()
                .and(spec1);
            
            assertNotNull(builder);
            
            SpecificationHandler.SpecificationBuilder<Object> sameBuilder = builder.or(spec2);
            assertNotNull(sameBuilder);
        }

        @Test
        @DisplayName("Should handle false conditions in builder")
        void shouldHandleFalseConditionsInBuilder() {
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec1)
                .andIf(false, spec2)
                .orIf(false, spec3)
                .build();
            
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("Real-World Scenarios")
    class RealWorldScenariosTests {

        @Test
        @DisplayName("Should handle complex food filtering scenario")
        void shouldHandleComplexFoodFilteringScenario() {
            Specification<Object> categoryFilter = (root, query, cb) -> cb.conjunction();
            Specification<Object> locationFilter = (root, query, cb) -> cb.conjunction();
            Specification<Object> dateFilter = (root, query, cb) -> cb.conjunction();
            Specification<Object> quantityFilter = (root, query, cb) -> cb.conjunction();
            
            boolean hasCategory = true;
            boolean hasLocation = true;
            boolean hasDateRange = false;
            boolean hasMinQuantity = true;
            
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .andIf(hasCategory, categoryFilter)
                .andIf(hasLocation, locationFilter)
                .andIf(hasDateRange, dateFilter)
                .andIf(hasMinQuantity, quantityFilter)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle search with multiple optional criteria")
        void shouldHandleSearchWithMultipleOptionalCriteria() {
            Specification<Object> nameSearch = (root, query, cb) -> cb.conjunction();
            Specification<Object> tagSearch = (root, query, cb) -> cb.conjunction();
            Specification<Object> descriptionSearch = (root, query, cb) -> cb.conjunction();
            
            List<Specification<Object>> searchCriteria = Arrays.asList(nameSearch, tagSearch, descriptionSearch);
            
            Specification<Object> searchSpec = SpecificationHandler.or(searchCriteria);
            Specification<Object> result = SpecificationHandler.<Object>builder()
                .and(spec1)
                .and(searchSpec)
                .build();
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle complex permission-based filtering")
        void shouldHandleComplexPermissionBasedFiltering() {
            Specification<Object> ownPosts = (root, query, cb) -> cb.conjunction();
            Specification<Object> publicPosts = (root, query, cb) -> cb.conjunction();
            Specification<Object> friendsPosts = (root, query, cb) -> cb.conjunction();
            
            List<Specification<Object>> visibilityRules = Arrays.asList(ownPosts, publicPosts, friendsPosts);
            Specification<Object> visibilitySpec = SpecificationHandler.or(visibilityRules);
            
            Specification<Object> activeSpec = (root, query, cb) -> cb.conjunction();
            
            Specification<Object> result = SpecificationHandler.and(visibilitySpec, activeSpec);
            
            assertNotNull(result);
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle specification that throws exception")
        void shouldHandleSpecificationThatThrowsException() {
            Specification<Object> throwingSpec = (root, query, cb) -> {
                throw new RuntimeException("Test exception");
            };
            
            Specification<Object> result = SpecificationHandler.and(spec1, throwingSpec);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle large number of specifications")
        void shouldHandleLargeNumberOfSpecifications() {
            Specification<Object>[] specs = new Specification[1000];
            for (int i = 0; i < 1000; i++) {
                specs[i] = (root, query, cb) -> cb.conjunction();
            }
            
            Specification<Object> result = SpecificationHandler.and(specs);
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle very deep nesting")
        void shouldHandleVeryDeepNesting() {
            Specification<Object> result = spec1;
            
            for (int i = 0; i < 100; i++) {
                result = SpecificationHandler.and(result, spec2);
            }
            
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle empty collections gracefully")
        void shouldHandleEmptyCollectionsGracefully() {
            List<Specification<Object>> emptyList = Collections.emptyList();
            
            assertNull(SpecificationHandler.and(emptyList));
            assertNull(SpecificationHandler.or(emptyList));
            
            @SuppressWarnings("unchecked")
            List<Specification<Object>>[] emptyArray = new List[0];
            assertNull(SpecificationHandler.andOfOrs(emptyArray));
            assertNull(SpecificationHandler.orOfAnds(emptyArray));
        }
    }
}