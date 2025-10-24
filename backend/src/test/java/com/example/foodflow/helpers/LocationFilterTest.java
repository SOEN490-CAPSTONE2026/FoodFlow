package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.data.jpa.domain.Specification;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("LocationFilter Tests")
class LocationFilterTest {

    private Location montrealDowntown;
    private Location montrealPlateau;
    private Location torontoDowntown;
    private Location nearbyLocation;
    private Location farLocation;

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
        @DisplayName("Should create all comparison filters successfully")
        void shouldCreateAllComparisonFiltersSuccessfully() {
            assertDoesNotThrow(() -> {
                LocationFilter.greaterThan(montrealDowntown, 2.0);
                LocationFilter.greaterThanOrEqual(montrealDowntown, 2.0);
                LocationFilter.lessThan(montrealDowntown, 8.0);
                LocationFilter.lessThanOrEqual(montrealDowntown, 8.0);
            });
        }

        @Test
        @DisplayName("Should throw exception for null reference location")
        void shouldThrowExceptionForNullReferenceLocation() {
            assertThrows(NullPointerException.class, () -> {
                LocationFilter.within(null, 5.0);
            });
        }

        @Test
        @DisplayName("Should throw exception for reference location with null coordinates")
        void shouldThrowExceptionForReferenceLocationWithNullCoordinates() {
            // The Location constructor itself will throw NPE for null coordinates
            assertThrows(NullPointerException.class, () -> {
                Location invalidLocation = new Location(null, -73.5673, "Invalid");
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
                LocationFilter.within(montrealDowntown, 0.0);
                LocationFilter.exactly(montrealDowntown, 5.0, 0.0);
            });
        }
    }

    @Nested
    @DisplayName("WITHIN Operation")
    class WithinTests {

        @Test
        @DisplayName("Should return true for location within distance")
        void shouldReturnTrueForLocationWithinDistance() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            // nearbyLocation is about 0.5km away, should be within 5km
            assertTrue(filter.check(nearbyLocation));
            
            // montrealPlateau is about 3-4km away, should be within 5km
            assertTrue(filter.check(montrealPlateau));
        }

        @Test
        @DisplayName("Should return false for location outside distance")
        void shouldReturnFalseForLocationOutsideDistance() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 2.0);
            
            // montrealPlateau is about 3-4km away, should be outside 2km
            assertFalse(filter.check(montrealPlateau));
            
            // torontoDowntown is very far, definitely outside 2km
            assertFalse(filter.check(torontoDowntown));
        }

        @Test
        @DisplayName("Should return true for exact same location")
        void shouldReturnTrueForExactSameLocation() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 1.0);
            
            // Same coordinates should have distance 0
            Location sameLocation = new Location(45.5017, -73.5673, "Same Location");
            assertTrue(filter.check(sameLocation));
        }

        @Test
        @DisplayName("Should handle boundary conditions correctly")
        void shouldHandleBoundaryConditionsCorrectly() {
            // Create a location exactly at the boundary distance
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.within(montrealDowntown, exactDistance);
            
            // Should return true for distance equal to the limit (<=)
            assertTrue(filter.check(nearbyLocation));
        }
    }

    @Nested
    @DisplayName("OUTSIDE Operation")
    class OutsideTests {

        @Test
        @DisplayName("Should return true for location outside distance")
        void shouldReturnTrueForLocationOutsideDistance() {
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 1.0);
            
            // montrealPlateau is about 3-4km away, should be outside 1km
            assertTrue(filter.check(montrealPlateau));
            
            // torontoDowntown is very far, definitely outside 1km
            assertTrue(filter.check(torontoDowntown));
        }

        @Test
        @DisplayName("Should return false for location within distance")
        void shouldReturnFalseForLocationWithinDistance() {
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 10.0);
            
            // nearbyLocation is about 0.5km away, should be within 10km
            assertFalse(filter.check(nearbyLocation));
            
            // montrealPlateau is about 3-4km away, should be within 10km
            assertFalse(filter.check(montrealPlateau));
        }

        @Test
        @DisplayName("Should return false for exact same location")
        void shouldReturnFalseForExactSameLocation() {
            LocationFilter filter = LocationFilter.outside(montrealDowntown, 1.0);
            
            Location sameLocation = new Location(45.5017, -73.5673, "Same Location");
            assertFalse(filter.check(sameLocation));
        }

        @Test
        @DisplayName("Should handle boundary conditions correctly")
        void shouldHandleBoundaryConditionsCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.outside(montrealDowntown, exactDistance);
            
            // Should return false for distance equal to the limit (not >)
            assertFalse(filter.check(nearbyLocation));
        }
    }

    @Nested
    @DisplayName("EXACTLY Operation")
    class ExactlyTests {

        @Test
        @DisplayName("Should return true for location at exact distance within tolerance")
        void shouldReturnTrueForLocationAtExactDistanceWithinTolerance() {
            double actualDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, actualDistance, 0.1);
            
            assertTrue(filter.check(nearbyLocation));
        }

        @Test
        @DisplayName("Should return true for location within tolerance range")
        void shouldReturnTrueForLocationWithinToleranceRange() {
            double targetDistance = 3.0;
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, targetDistance, 1.0);
            
            // montrealPlateau is about 3-4km away, should be within 3.0±1.0km
            assertTrue(filter.check(montrealPlateau));
        }

        @Test
        @DisplayName("Should return false for location outside tolerance range")
        void shouldReturnFalseForLocationOutsideToleranceRange() {
            double targetDistance = 1.0;
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, targetDistance, 0.1);
            
            // montrealPlateau is about 3-4km away, should be outside 1.0±0.1km
            assertFalse(filter.check(montrealPlateau));
        }

        @Test
        @DisplayName("Should work with zero tolerance")
        void shouldWorkWithZeroTolerance() {
            double actualDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, actualDistance, 0.0);
            
            // Should still work due to floating point precision
            assertTrue(filter.check(nearbyLocation));
        }

        @Test
        @DisplayName("Should handle boundary conditions correctly")
        void shouldHandleBoundaryConditionsCorrectly() {
            double actualDistance = montrealDowntown.distanceTo(nearbyLocation);
            double tolerance = 0.1;
            LocationFilter filter = LocationFilter.exactly(montrealDowntown, actualDistance, tolerance);
            
            // Create locations at the boundary of tolerance
            assertTrue(filter.check(nearbyLocation)); // Should be within tolerance
        }
    }

    @Nested
    @DisplayName("Comparison Operations")
    class ComparisonTests {

        @Test
        @DisplayName("GREATER_THAN should work correctly")
        void greaterThanShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.greaterThan(montrealDowntown, 2.0);
            
            assertTrue(filter.check(montrealPlateau));  // ~3-4km > 2km
            assertFalse(filter.check(nearbyLocation));  // ~0.5km < 2km
        }

        @Test
        @DisplayName("GREATER_THAN_OR_EQUAL should work correctly")
        void greaterThanOrEqualShouldWorkCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.greaterThanOrEqual(montrealDowntown, exactDistance);
            
            assertTrue(filter.check(nearbyLocation));   // Equal case
            assertTrue(filter.check(montrealPlateau));  // Greater case
        }

        @Test
        @DisplayName("LESS_THAN should work correctly")
        void lessThanShouldWorkCorrectly() {
            LocationFilter filter = LocationFilter.lessThan(montrealDowntown, 2.0);
            
            assertTrue(filter.check(nearbyLocation));   // ~0.5km < 2km
            assertFalse(filter.check(montrealPlateau)); // ~3-4km > 2km
        }

        @Test
        @DisplayName("LESS_THAN_OR_EQUAL should work correctly")
        void lessThanOrEqualShouldWorkCorrectly() {
            double exactDistance = montrealDowntown.distanceTo(nearbyLocation);
            LocationFilter filter = LocationFilter.lessThanOrEqual(montrealDowntown, exactDistance);
            
            assertTrue(filter.check(nearbyLocation));    // Equal case
            assertFalse(filter.check(montrealPlateau));  // Greater case
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should throw exception when checking null target location")
        void shouldThrowExceptionWhenCheckingNullTargetLocation() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertThrows(NullPointerException.class, () -> {
                filter.check(null);
            });
        }

        @Test
        @DisplayName("Should throw exception for target location with null coordinates")
        void shouldThrowExceptionForTargetLocationWithNullCoordinates() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            // The Location constructor itself will throw NPE for null coordinates
            assertThrows(NullPointerException.class, () -> {
                Location invalidTarget = new Location(null, -73.5673, "Invalid Target");
            });
        }

        @Test
        @DisplayName("Should handle very small distances correctly")
        void shouldHandleVerySmallDistancesCorrectly() {
            Location veryClose = new Location(45.5017001, -73.5673001, "Very Close");
            LocationFilter filter = LocationFilter.within(montrealDowntown, 0.001);
            
            // Should work with very small distances
            assertDoesNotThrow(() -> filter.check(veryClose));
        }

        @Test
        @DisplayName("Should handle very large distances correctly")
        void shouldHandleVeryLargeDistancesCorrectly() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 1000.0);
            
            assertTrue(filter.check(torontoDowntown)); // Even Toronto should be within 1000km
        }

        @Test
        @DisplayName("Should handle locations at poles and equator")
        void shouldHandleLocationsAtPolesAndEquator() {
            Location northPole = new Location(90.0, 0.0, "North Pole");
            Location equator = new Location(0.0, 0.0, "Equator");
            
            LocationFilter filter = LocationFilter.within(northPole, 20000.0); // Half earth circumference
            
            assertDoesNotThrow(() -> filter.check(equator));
        }

        @Test
        @DisplayName("Should handle same location with different addresses")
        void shouldHandleSameLocationWithDifferentAddresses() {
            Location sameCoords = new Location(45.5017, -73.5673, "Different Address");
            LocationFilter filter = LocationFilter.within(montrealDowntown, 0.1);
            
            assertTrue(filter.check(sameCoords)); // Same coordinates, different address
        }
    }

    @Nested
    @DisplayName("Distance Calculation Accuracy")
    class DistanceAccuracyTests {

        @Test
        @DisplayName("Should calculate accurate distances for known locations")
        void shouldCalculateAccurateDistancesForKnownLocations() {
            // Montreal to Toronto is approximately 540km
            LocationFilter filter = LocationFilter.within(montrealDowntown, 600.0);
            assertTrue(filter.check(torontoDowntown));
            
            LocationFilter tightFilter = LocationFilter.within(montrealDowntown, 500.0);
            assertFalse(tightFilter.check(torontoDowntown));
        }

        @Test
        @DisplayName("Should be consistent with Location.distanceTo method")
        void shouldBeConsistentWithLocationDistanceToMethod() {
            double manualDistance = montrealDowntown.distanceTo(montrealPlateau);
            
            // Filter at exact distance should include the location
            LocationFilter exactFilter = LocationFilter.within(montrealDowntown, manualDistance);
            assertTrue(exactFilter.check(montrealPlateau));
            
            // Filter just under the distance should exclude the location
            LocationFilter underFilter = LocationFilter.within(montrealDowntown, manualDistance - 0.001);
            assertFalse(underFilter.check(montrealPlateau));
        }
    }

    @Nested
    @DisplayName("Object Methods")
    class ObjectMethodTests {

        @Test
        @DisplayName("Should implement equals correctly")
        void shouldImplementEqualsCorrectly() {
            LocationFilter filter1 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter2 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter3 = LocationFilter.within(montrealDowntown, 3.0);
            LocationFilter filter4 = LocationFilter.outside(montrealDowntown, 5.0);
            
            assertEquals(filter1, filter2);
            assertNotEquals(filter1, filter3); // Different distance
            assertNotEquals(filter1, filter4); // Different operation
            assertNotEquals(filter1, null);
            assertNotEquals(filter1, "not a filter");
        }

        @Test
        @DisplayName("Should implement hashCode correctly")
        void shouldImplementHashCodeCorrectly() {
            LocationFilter filter1 = LocationFilter.within(montrealDowntown, 5.0);
            LocationFilter filter2 = LocationFilter.within(montrealDowntown, 5.0);
            
            assertEquals(filter1.hashCode(), filter2.hashCode());
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
    @DisplayName("JPA Specification")
    class SpecificationTests {

        @Test
        @DisplayName("Should create specification without throwing exceptions")
        void shouldCreateSpecificationWithoutThrowingExceptions() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            assertDoesNotThrow(() -> {
                Specification<Object> spec = filter.toSpecification("pickupLocation");
                assertNotNull(spec);
            });
        }

        @Test
        @DisplayName("Should handle all operations in specification")
        void shouldHandleAllOperationsInSpecification() {
            assertDoesNotThrow(() -> {
                LocationFilter.within(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.outside(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.exactly(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.greaterThan(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.greaterThanOrEqual(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.lessThan(montrealDowntown, 5.0).toSpecification("location");
                LocationFilter.lessThanOrEqual(montrealDowntown, 5.0).toSpecification("location");
            });
        }
    }

    @Nested
    @DisplayName("Real-World Scenarios")
    class RealWorldScenarioTests {

        @Test
        @DisplayName("Should work for finding nearby food donations")
        void shouldWorkForFindingNearbyFoodDonations() {
            // Scenario: User wants food donations within walking distance (1.5km)
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
            // Scenario: Restaurant delivers within 5km radius
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
            // Scenario: Avoid spam by excluding locations too close to each other
            Location baseLocation = new Location(45.5017, -73.5673, "Base");
            LocationFilter notTooClose = LocationFilter.greaterThan(baseLocation, 0.1); // > 100m
            
            Location tooClose = new Location(45.5018, -73.5674, "Too Close");
            Location justRight = new Location(45.5030, -73.5680, "Just Right");
            
            assertFalse(notTooClose.check(tooClose));
            assertTrue(notTooClose.check(justRight));
        }

        @Test
        @DisplayName("Should work for finding locations in specific distance band")
        void shouldWorkForFindingLocationsInSpecificDistanceBand() {
            // Scenario: Find locations between 2-5km (not too close, not too far)
            Location center = new Location(45.5017, -73.5673, "Center");
            LocationFilter minDistance = LocationFilter.greaterThan(center, 2.0);
            LocationFilter maxDistance = LocationFilter.lessThanOrEqual(center, 5.0);
            
            Location tooClose = new Location(45.5030, -73.5680, "Too Close"); // ~1km
            Location justRight = new Location(45.5200, -73.5800, "Just Right"); // ~3-4km
            Location tooFar = new Location(45.4000, -73.4000, "Too Far"); // ~15km
            
            // Combine filters for distance band
            assertFalse(minDistance.check(tooClose));
            assertTrue(minDistance.check(justRight) && maxDistance.check(justRight));
            assertFalse(maxDistance.check(tooFar));
        }
    }

    @Nested
    @DisplayName("Performance and Edge Cases")
    class PerformanceTests {

        @Test
        @DisplayName("Should handle many location checks efficiently")
        void shouldHandleManyLocationChecksEfficiently() {
            LocationFilter filter = LocationFilter.within(montrealDowntown, 5.0);
            
            // This should complete quickly even with many checks
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

        @Test
        @DisplayName("Should handle extreme coordinates correctly")
        void shouldHandleExtremeCoordinatesCorrectly() {
            // Test with extreme valid coordinates
            Location northExtreme = new Location(89.999, 179.999, "North Extreme");
            Location southExtreme = new Location(-89.999, -179.999, "South Extreme");
            
            LocationFilter filter = LocationFilter.within(northExtreme, 25000.0); // Half earth
            
            assertDoesNotThrow(() -> filter.check(southExtreme));
        }
    }
}