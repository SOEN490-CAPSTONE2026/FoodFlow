package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.lang.reflect.Constructor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("LocationFilter Tests")
class LocationFilterTest {

    private Location montrealDowntown;
    private Location montrealPlateau;
    private Location torontoDowntown;
    private Location nearbyLocation;
    private Location farLocation;

    @Mock
    private Root<Object> root;
    @Mock
    private CriteriaQuery<?> query;
    @Mock
    private CriteriaBuilder criteriaBuilder;
    @Mock
    private Path<Object> locationPath;
    @Mock
    private Path<Double> latPath;
    @Mock
    private Path<Double> lonPath;
    @Mock
    private Predicate mockPredicate;

    @BeforeEach
    void setUp() {
        // Montreal Downtown (reference point)
        montrealDowntown = new Location(45.5017, -73.5673, "Montreal Downtown");
        
        // Montreal Plateau (about 3-4 km away)
        montrealPlateau = new Location(45.5200, -73.5800, "Plateau Mont-Royal");
        
        // Toronto Downtown (about 540 km away)
        torontoDowntown = new Location(43.6532, -79.3832, "Toronto Downtown");
        
        // Very close location (about 0.5 km away)
        nearbyLocation = new Location(45.5050, -73.5700, "Nearby Location");
        
        // Far location (about 15 km away)
        farLocation = new Location(45.4000, -73.4000, "Far Location");
    }

    @Nested
    @DisplayName("Constructor and Factory Methods")
    class ConstructorTests {

        @Test
        @DisplayName("Should create WITHIN filter successfully")
        void shouldCreateWithinFilterSuccessfully() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertNotNull(filter);
            assertEquals(montrealDowntown, filter.getReferenceLocation());
            assertEquals(5.0, filter.getDistanceKm(), 0.001);
            assertEquals(LocationFilter.Operation.WITHIN, filter.getOperation());
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create OUTSIDE filter successfully")
        void shouldCreateOutsideFilterSuccessfully() {
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 10.0);
            
            assertNotNull(filter);
            assertEquals(LocationFilter.Operation.OUTSIDE, filter.getOperation());
            assertEquals(10.0, filter.getDistanceKm(), 0.001);
        }

        @Test
        @DisplayName("Should create EXACTLY filter with default tolerance")
        void shouldCreateExactlyFilterWithDefaultTolerance() {
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, 3.0);
            
            assertEquals(LocationFilter.Operation.EXACTLY, filter.getOperation());
            assertEquals(3.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create EXACTLY filter with custom tolerance")
        void shouldCreateExactlyFilterWithCustomTolerance() {
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, 3.0, 0.5);
            
            assertEquals(LocationFilter.Operation.EXACTLY, filter.getOperation());
            assertEquals(3.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.5, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create GREATER_THAN filter successfully")
        void shouldCreateGreaterThanFilterSuccessfully() {
            LocationFilter filter = LocationFilter.greaterThan(montrealDowntown, 2.0);
            
            assertEquals(LocationFilter.Operation.GREATER_THAN, filter.getOperation());
            assertEquals(2.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create GREATER_THAN_OR_EQUAL filter successfully")
        void shouldCreateGreaterThanOrEqualFilterSuccessfully() {
            LocationFilter filter = LocationFilter.greaterThanOrEqual(montrealDowntown, 2.0);
            
            assertEquals(LocationFilter.Operation.GREATER_THAN_OR_EQUAL, filter.getOperation());
            assertEquals(2.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create LESS_THAN filter successfully")
        void shouldCreateLessThanFilterSuccessfully() {
            LocationFilter filter = LocationFilter.lessThan(montrealDowntown, 8.0);
            
            assertEquals(LocationFilter.Operation.LESS_THAN, filter.getOperation());
            assertEquals(8.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should create LESS_THAN_OR_EQUAL filter successfully")
        void shouldCreateLessThanOrEqualFilterSuccessfully() {
            LocationFilter filter = LocationFilter.lessThanOrEqual(montrealDowntown, 8.0);
            
            assertEquals(LocationFilter.Operation.LESS_THAN_OR_EQUAL, filter.getOperation());
            assertEquals(8.0, filter.getDistanceKm(), 0.001);
            assertEquals(0.1, filter.getTolerance(), 0.001);
        }

        @Test
        @DisplayName("Should throw exception for null reference location")
        void shouldThrowExceptionForNullReferenceLocation() {
            assertThrows(NullPointerException.class, () -> {
                LocationFilter.within(null, 5.0);
            });
        }

        @Test
        @DisplayName("Should throw exception for negative distance")
        void shouldThrowExceptionForNegativeDistance() {
            assertThrows(IllegalArgumentException.class, () -> {
                LocationFilter.within(montrealDowntown, -1.0);
            });
        }

        @Test
        @DisplayName("Should throw exception for negative tolerance")
        void shouldThrowExceptionForNegativeTolerance() {
            assertThrows(IllegalArgumentException.class, () -> {
                LocationFilter.exactly(montrealDowntown, 5.0, -0.1);
            });
        }

        @Test
        @DisplayName("Should accept zero distance and tolerance")
        void shouldAcceptZeroDistanceAndTolerance() {
            assertDoesNotThrow(() -> {
                LocationFilter filter1 = LocationFilter.within(montrealDowntown, 0.0);
                LocationFilter filter2 = LocationFilter.exactly(montrealDowntown, 5.0, 0.0);
                
                assertEquals(0.0, filter1.getDistanceKm());
                assertEquals(0.0, filter2.getTolerance());
            });
        }
    }

    @Nested
    @DisplayName("Check Method - All Operations")
    class CheckMethodTests {

        @Test
        @DisplayName("Should throw exception for null target location")
        void shouldThrowExceptionForNullTargetLocation() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertThrows(NullPointerException.class, () -> {
                filter.check(null);
            });
        }

        @Test
        @DisplayName("WITHIN operation should work correctly")
        void withinOperationShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertTrue(filter.check(nearbyLocation)); // ~0.5km - within 5km
            assertTrue(filter.check(montrealPlateau)); // ~3-4km - within 5km
            assertFalse(filter.check(farLocation)); // ~15km - outside 5km
            assertTrue(filter.check(montrealDowntown)); // same location - distance 0
        }

        @Test
        @DisplayName("OUTSIDE operation should work correctly")
        void outsideOperationShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 5.0);
            
            assertFalse(filter.check(nearbyLocation)); // ~0.5km - within 5km
            assertFalse(filter.check(montrealPlateau)); // ~3-4km - within 5km
            assertTrue(filter.check(farLocation)); // ~15km - outside 5km
            assertFalse(filter.check(montrealDowntown)); // same location - distance 0
        }

        @Test
        @DisplayName("EXACTLY operation should work correctly")
        void exactlyOperationShouldWorkCorrectly() {
            double expectedDistance = montrealDowntown.distanceTo(montrealPlateau);
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, expectedDistance, 0.5);
            
            assertTrue(filter.check(montrealPlateau)); // Should be within tolerance
            assertFalse(filter.check(farLocation)); // ~15km - way off target
            assertFalse(filter.check(nearbyLocation)); // ~0.5km - too close
        }

        @Test
        @DisplayName("GREATER_THAN operation should work correctly")
        void greaterThanOperationShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.greaterThan(montrealDowntown, 2.0);
            
            assertFalse(filter.check(nearbyLocation)); // ~0.5km <= 2km
            assertTrue(filter.check(montrealPlateau)); // ~3-4km > 2km
            assertTrue(filter.check(farLocation)); // ~15km > 2km
            assertFalse(filter.check(montrealDowntown)); // distance 0 <= 2km
        }

        @Test
        @DisplayName("GREATER_THAN_OR_EQUAL operation should work correctly")
        void greaterThanOrEqualOperationShouldWorkCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(montrealPlateau);
            LocationFilter filter = LocationFilter.greaterThanOrEqual(montrealDowntown, exactDistance);
            
            assertTrue(filter.check(montrealPlateau)); // exactly equal distance
            assertTrue(filter.check(farLocation)); // greater than distance
            assertFalse(filter.check(nearbyLocation)); // less than distance
        }

        @Test
        @DisplayName("LESS_THAN operation should work correctly")
        void lessThanOperationShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.lessThan(montrealDowntown, 2.0);
            
            assertTrue(filter.check(nearbyLocation)); // ~0.5km < 2km
            assertFalse(filter.check(montrealPlateau)); // ~3-4km >= 2km
            assertFalse(filter.check(farLocation)); // ~15km >= 2km
            assertTrue(filter.check(montrealDowntown)); // distance 0 < 2km
        }

        @Test
        @DisplayName("LESS_THAN_OR_EQUAL operation should work correctly")
        void lessThanOrEqualOperationShouldWorkCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(montrealPlateau);
            LocationFilter filter = LocationFilter.lessThanOrEqual(montrealDowntown, exactDistance);
            
            assertTrue(filter.check(montrealPlateau)); // exactly equal distance
            assertTrue(filter.check(nearbyLocation)); // less than distance
            assertFalse(filter.check(farLocation)); // greater than distance
        }

        @Test
        @DisplayName("Should handle boundary conditions correctly")
        void shouldHandleBoundaryConditionsCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            
            LocationFilter withinFilter = LocationFilter.within(montrealDowntown, exactDistance);
            LocationFilter lessThanFilter = LocationFilter.lessThan(montrealDowntown, exactDistance);
            
            assertTrue(withinFilter.check(nearbyLocation)); // <= includes equal
            assertFalse(lessThanFilter.check(nearbyLocation)); // < excludes equal
        }
    }

    @Nested
    @DisplayName("Object Methods")
    class ObjectMethodTests {

        @Test
        @DisplayName("Should implement equals correctly for identical filters")
        void shouldImplementEqualsCorrectlyForIdenticalFilters() {
            LocationFilter filter1 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter2 = LocationFilter.within(montrealDowntown, 5.0);
            
            assertEquals(filter1, filter2);
            assertEquals(filter1, filter1); // reflexive
        }

        @Test
        @DisplayName("Should implement equals correctly for different filters")
        void shouldImplementEqualsCorrectlyForDifferentFilters() {
            LocationFilter filter1 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter2 = LocationFilter.within(montrealDowntown, 3.0); // Different distance
            LocationFilter filter3 = LocationFilter.outside(montrealDowntown, 5.0); // Different operation
            LocationFilter filter4 = LocationFilter.within(torontoDowntown, 5.0); // Different location
            LocationFilter filter5 = LocationFilter.exactly(montrealDowntown, 5.0, 0.5); // Different tolerance
            
            assertNotEquals(filter1, filter2);
            assertNotEquals(filter1, filter3);
            assertNotEquals(filter1, filter4);
            assertNotEquals(filter1, filter5);
            assertNotEquals(filter1, null);
            assertNotEquals(filter1, "not a filter");
        }

        @Test
        @DisplayName("Should implement hashCode correctly")
        void shouldImplementHashCodeCorrectly() {
            LocationFilter filter1 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter2 = LocationFilter.within(montrealDowntown, 5.0);
            
            assertEquals(filter1.hashCode(), filter2.hashCode());
            
            // Hash code should be consistent
            assertEquals(filter1.hashCode(), filter1.hashCode());
        }

        @Test
        @DisplayName("Should implement toString correctly")
        void shouldImplementToStringCorrectly() {
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, 5.0, 0.25);
            String toString = filter.toString();
            
            assertTrue(toString.contains("LocationFilter"));
            assertTrue(toString.contains("EXACTLY"));
            assertTrue(toString.contains("5.00km"));
            assertTrue(toString.contains("0.25km"));
            assertTrue(toString.contains("Montreal Downtown"));
        }
    }

    @Nested
    @DisplayName("JPA Specification Generation")
    class SpecificationTests {

        @SuppressWarnings("unchecked")
        private void setUpBasicMocks() {
            when(root.get(anyString())).thenReturn(locationPath);
            when(locationPath.get(eq("latitude"))).thenReturn((Path) latPath);
            when(locationPath.get(eq("longitude"))).thenReturn((Path) lonPath);
        }

        @SuppressWarnings("unchecked")
        private void setUpCriteriaBuilderMocks() {
            // Mock methods for Haversine calculation
            when(criteriaBuilder.literal(any(Double.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.prod(any(Expression.class), any(Expression.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.diff(any(Expression.class), any(Expression.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.quot(any(Expression.class), any(Expression.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.sum(any(Expression.class), any(Expression.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.function(anyString(), eq(Double.class), any(Expression.class))).thenReturn(mock(Expression.class));
            when(criteriaBuilder.function(anyString(), eq(Double.class), any(Expression.class), any(Expression.class))).thenReturn(mock(Expression.class));
        }

        @Test
        @DisplayName("Should create WITHIN specification correctly")
        void shouldCreateWithinSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).lessThanOrEqualTo(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should create OUTSIDE specification correctly")
        void shouldCreateOutsideSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.greaterThan(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).greaterThan(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should create EXACTLY specification correctly")
        void shouldCreateExactlySpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.greaterThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            when(criteriaBuilder.and(any(Predicate.class), any(Predicate.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, 5.0, 0.5);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).greaterThanOrEqualTo(any(Expression.class), eq(4.5));
            verify(criteriaBuilder).lessThanOrEqualTo(any(Expression.class), eq(5.5));
            verify(criteriaBuilder).and(any(Predicate.class), any(Predicate.class));
        }

        @Test
        @DisplayName("Should create GREATER_THAN specification correctly")
        void shouldCreateGreaterThanSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.greaterThan(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.greaterThan(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).greaterThan(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should create GREATER_THAN_OR_EQUAL specification correctly")
        void shouldCreateGreaterThanOrEqualSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.greaterThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.greaterThanOrEqual(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).greaterThanOrEqualTo(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should create LESS_THAN specification correctly")
        void shouldCreateLessThanSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThan(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.lessThan(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).lessThan(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should create LESS_THAN_OR_EQUAL specification correctly")
        void shouldCreateLessThanOrEqualSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.lessThanOrEqual(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).lessThanOrEqualTo(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should verify Haversine calculation is used")
        void shouldVerifyHaversineCalculationIsUsed() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), any(Double.class)))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify that trigonometric functions are called for Haversine
            verify(criteriaBuilder, atLeastOnce()).function(eq("SIN"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, atLeastOnce()).function(eq("COS"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, atLeastOnce()).function(eq("SQRT"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, atLeastOnce()).function(eq("ATAN2"), eq(Double.class), any(Expression.class), any(Expression.class));
        }
    }

    @Nested
    @DisplayName("Real-World Scenarios")
    class RealWorldScenarioTests {

        @Test
        @DisplayName("Should work for finding nearby food donations")
        void shouldWorkForFindingNearbyFoodDonations() {
            Location userLocation = new Location(45.5017, -73.5673, "User Location");
            LocationFilter walkingDistance = LocationFilter.within(userLocation, 1.5);
            
            Location nearbyDonation = new Location(45.5030, -73.5680, "Nearby Donation");
            Location farDonation = new Location(45.5200, -73.5800, "Far Donation");
            
            assertTrue(walkingDistance.check(nearbyDonation));
            assertFalse(walkingDistance.check(farDonation));
        }

        @Test
        @DisplayName("Should work for delivery service radius")
        void shouldWorkForDeliveryServiceRadius() {
            Location restaurant = new Location(45.5100, -73.5700, "Restaurant");
            LocationFilter deliveryZone = LocationFilter.within(restaurant, 5.0);
            
            Location customerInZone = new Location(45.5200, -73.5800, "Customer");
            Location customerOutOfZone = new Location(45.4000, -73.4000, "Distant Customer");
            
            assertTrue(deliveryZone.check(customerInZone));
            assertFalse(deliveryZone.check(customerOutOfZone));
        }

        @Test
        @DisplayName("Should work for excluding too close locations")
        void shouldWorkForExcludingTooCloseLocations() {
            Location baseLocation = new Location(45.5017, -73.5673, "Base");
            LocationFilter notTooClose = LocationFilter.greaterThan(baseLocation, 0.1);
            
            Location tooClose = new Location(45.5018, -73.5674, "Too Close");
            Location justRight = new Location(45.5030, -73.5680, "Just Right");
            
            assertFalse(notTooClose.check(tooClose));
            assertTrue(notTooClose.check(justRight));
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle zero distance filter")
        void shouldHandleZeroDistanceFilter() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 0.0);
            
            assertEquals(0.0, filter.getDistanceKm());
            assertTrue(filter.check(montrealDowntown)); // Same location has distance 0
            assertFalse(filter.check(nearbyLocation)); // Any other location should fail
        }

        @Test
        @DisplayName("Should handle very large distance filter")
        void shouldHandleVeryLargeDistanceFilter() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 20000.0);
            
            assertTrue(filter.check(torontoDowntown)); // Should include locations across continents
        }

        @Test
        @DisplayName("Should handle extreme coordinates")
        void shouldHandleExtremeCoordinates() {
            Location northPole = new Location(89.999, 0.0, "North Pole");
            Location southPole = new Location(-89.999, 0.0, "South Pole");
            
            LocationFilter filter = LocationFilter.within(northPole, 25000.0);
            
            assertDoesNotThrow(() -> filter.check(southPole));
        }

        @Test
        @DisplayName("Should handle very small tolerance in EXACTLY operation")
        void shouldHandleVerySmallToleranceInExactlyOperation() {
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, 1.0, 0.001);
            
            assertEquals(0.001, filter.getTolerance());
            assertNotNull(filter);
        }

        @Test
        @DisplayName("Should handle performance with many checks")
        void shouldHandlePerformanceWithManyChecks() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertDoesNotThrow(() -> {
                for (int i = 0; i < 1000; i++) {
                    Location testLocation = new Location(
                        45.5017 + (i * 0.001), 
                        -73.5673 + (i * 0.001), 
                        "Test " + i
                    );
                    filter.check(testLocation);
                }
            });
        }
    }
}