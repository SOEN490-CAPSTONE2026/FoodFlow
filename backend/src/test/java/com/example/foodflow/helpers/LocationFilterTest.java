package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
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
        @DisplayName("Should accept zero distance")
        void shouldAcceptZeroDistanceAndTolerance() {
            assertDoesNotThrow(() -> {
                LocationFilter filter1 = LocationFilter.within(montrealDowntown, 0.0);
                
                assertEquals(0.0, filter1.getDistanceKm());
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
        @DisplayName("Should handle boundary conditions correctly")
        void shouldHandleBoundaryConditionsCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            
            LocationFilter withinFilter = LocationFilter.within(montrealDowntown, exactDistance);
            
            assertTrue(withinFilter.check(nearbyLocation)); // <= includes equal
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
            
            assertNotEquals(filter1, filter2);
            assertNotEquals(filter1, filter3);
            assertNotEquals(filter1, filter4);
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
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            String toString = filter.toString();
            
            assertTrue(toString.contains("LocationFilter"));
            assertTrue(toString.contains("WITHIN"));
            assertTrue(toString.contains("5.00km"));
            assertTrue(toString.contains("Montreal Downtown"));
        }
    }

    @Nested
    @DisplayName("JPA Specification Generation")
    class SpecificationTests {

        private Expression<Double> mockExpression;
        
        @BeforeEach
        void setUpMockExpression() {
            mockExpression = mock(Expression.class);
        }

        @SuppressWarnings("unchecked")
        private void setUpBasicMocks() {
            when(root.get(anyString())).thenReturn(locationPath);
            when(locationPath.get(eq("latitude"))).thenReturn((Path) latPath);
            when(locationPath.get(eq("longitude"))).thenReturn((Path) lonPath);
        }

        @SuppressWarnings("unchecked")
        private void setUpCriteriaBuilderMocks() {
            // Mock methods for simplified Haversine calculation
            // IMPORTANT: Return mock Expression objects, not null
            when(criteriaBuilder.literal(any(Double.class))).thenReturn(mockExpression);
            when(criteriaBuilder.prod(any(Expression.class), any(Expression.class))).thenReturn(mockExpression);
            when(criteriaBuilder.prod(any(Expression.class), anyDouble())).thenReturn(mockExpression);
            when(criteriaBuilder.prod(anyDouble(), any(Expression.class))).thenReturn(mockExpression);
            when(criteriaBuilder.diff(any(Expression.class), any(Expression.class))).thenReturn(mockExpression);
            when(criteriaBuilder.diff(any(Expression.class), anyDouble())).thenReturn(mockExpression);
            when(criteriaBuilder.sum(any(Expression.class), any(Expression.class))).thenReturn(mockExpression);
            when(criteriaBuilder.function(anyString(), eq(Double.class), any(Expression.class))).thenReturn(mockExpression);
            when(criteriaBuilder.function(anyString(), eq(Double.class), any(Expression.class), any(Expression.class))).thenReturn(mockExpression);
        }

        @Test
        @DisplayName("Should create WITHIN specification correctly")
        void shouldCreateWithinSpecificationCorrectly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
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
            when(criteriaBuilder.greaterThan(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            assertNotNull(spec);
            spec.toPredicate(root, query, criteriaBuilder);
            
            verify(criteriaBuilder).greaterThan(any(Expression.class), eq(5.0));
        }

        @Test
        @DisplayName("Should verify simplified Haversine calculation is used")
        void shouldVerifyHaversineCalculationIsUsed() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify that simplified Haversine formula functions are called
            // The new implementation uses: cos, sin, greatest, least, acos
            verify(criteriaBuilder, atLeast(2)).function(eq("cos"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, atLeast(1)).function(eq("sin"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, times(1)).function(eq("least"), eq(Double.class), any(Expression.class), any(Expression.class));
            verify(criteriaBuilder, times(1)).function(eq("greatest"), eq(Double.class), any(Expression.class), any(Expression.class));
            verify(criteriaBuilder, times(1)).function(eq("acos"), eq(Double.class), any(Expression.class));
        }

        @Test
        @DisplayName("Should use prod for converting degrees to radians")
        void shouldConvertDegreesToRadians() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify that degree-to-radian conversion is done using multiplication
            // Should multiply by (PI / 180.0) which is approximately 0.01745
            verify(criteriaBuilder, atLeast(2)).prod(any(Expression.class), eq(Math.PI / 180.0));
        }

        @Test
        @DisplayName("Should clamp values to prevent acos domain errors")
        void shouldClampValuesForAcos() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify clamping: greatest(-1.0, least(1.0, a))
            verify(criteriaBuilder, times(1)).function(eq("least"), eq(Double.class), any(Expression.class), any(Expression.class));
            verify(criteriaBuilder, times(1)).function(eq("greatest"), eq(Double.class), any(Expression.class), any(Expression.class));
            
            // Verify the clamping uses correct bounds
            verify(criteriaBuilder, times(1)).literal(1.0);
            verify(criteriaBuilder, times(1)).literal(-1.0);
        }

        @Test
        @DisplayName("Should multiply by Earth radius (6371 km)")
        void shouldMultiplyByEarthRadius() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify final multiplication by Earth's radius
            verify(criteriaBuilder, times(1)).prod(eq(6371.0), any(Expression.class));
        }

        @Test
        @DisplayName("Should access latitude and longitude from embedded location")
        void shouldAccessEmbeddedLocationFields() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // Verify that we access the embedded location's fields correctly
            verify(root).get("pickupLocation");
            verify(locationPath).get("latitude");
            verify(locationPath).get("longitude");
        }

        @Test
        @DisplayName("Should handle different distance values correctly")
        void shouldHandleDifferentDistances() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            
            // Reset mock between iterations
            Mockito.clearInvocations(criteriaBuilder);
            
            // Test with various distances
            double[] testDistances = {1.0, 5.0, 10.0, 50.0, 100.0};
            
            for (double distance : testDistances) {
                when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                        .thenReturn(mockPredicate);
                
                LocationFilter filter = LocationFilter.within(montrealDowntown, distance);
                Specification<Object> spec = filter.toSpecification("pickupLocation");
                
                spec.toPredicate(root, query, criteriaBuilder);
                
                verify(criteriaBuilder, atLeastOnce()).lessThanOrEqualTo(any(Expression.class), eq(distance));
                
                // Reset for next iteration
                Mockito.clearInvocations(criteriaBuilder);
                setUpCriteriaBuilderMocks();
            }
        }

        @Test
        @DisplayName("Should calculate cos and sin for database columns only")
        void shouldCalculateTrigForDatabaseColumnsOnly() {
            setUpBasicMocks();
            setUpCriteriaBuilderMocks();
            when(criteriaBuilder.lessThanOrEqualTo(any(Expression.class), anyDouble()))
                    .thenReturn(mockPredicate);
            
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            Specification<Object> spec = filter.toSpecification("pickupLocation");
            
            spec.toPredicate(root, query, criteriaBuilder);
            
            // The implementation pre-calculates reference point trig values in Java
            // Only target latitude/longitude use database functions
            // Should see cos and sin called for target coordinates
            verify(criteriaBuilder, atLeast(2)).function(eq("cos"), eq(Double.class), any(Expression.class));
            verify(criteriaBuilder, atLeast(1)).function(eq("sin"), eq(Double.class), any(Expression.class));
        }

    }

    //=====================================================
    //*****************************************************
    //====================================================

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
            LocationFilter notTooClose = LocationFilter.outside(baseLocation, 0.1);
            
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