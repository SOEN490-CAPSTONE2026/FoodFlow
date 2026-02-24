package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;

import java.util.Objects;

/**
 * Filter class for location-based distance filtering.
 * Uses Haversine formula to calculate distances between locations.
 */
public class LocationFilter implements Filter<Location> {

    /**
     * Supported operations for distance filtering.
     */
    public enum Operation {
        WITHIN,
        OUTSIDE
    }

    private final Location referenceLocation;
    private final double distanceKm;
    private final Operation operation;

    /**
     * Private constructor to enforce static factory methods usage.
     */
    protected LocationFilter(Location referenceLocation, double distanceKm, Operation operation) {
        this.referenceLocation = Objects.requireNonNull(referenceLocation, "Reference location cannot be null");
        if (distanceKm < 0) {
            throw new IllegalArgumentException("Distance cannot be negative");
        }
        this.distanceKm = distanceKm;
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
    }

    // Static factory methods
    public static LocationFilter within(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.WITHIN);
    }

    public static LocationFilter outside(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.OUTSIDE);
    }

    /**
     * Check if a target location satisfies this distance filter (in-memory).
     */
    @Override
    public boolean check(Location targetLocation) {
        Objects.requireNonNull(targetLocation, "Target location cannot be null");

        if (targetLocation.getLatitude() == null || targetLocation.getLongitude() == null) {
            return false;
        }

        double actualDistance = referenceLocation.distanceTo(targetLocation);

        switch (operation) {
            case WITHIN:
                return actualDistance <= distanceKm;
            case OUTSIDE:
                return actualDistance > distanceKm;
            default:
                throw new IllegalStateException("Unknown operation: " + operation);
        }
    }

    @Override
    public <E> Specification<E> toSpecification(String fieldName) {
        return (root, query, cb) -> {
            // Get the location field paths
            Path<Location> locationPath = root.get(fieldName);
            Path<Double> latPath = locationPath.get("latitude");
            Path<Double> lonPath = locationPath.get("longitude");

            // Create Haversine distance calculation expression
            Expression<Double> distanceExpression = createHaversineExpression(
                cb, latPath, lonPath, 
                referenceLocation.getLatitude(), 
                referenceLocation.getLongitude()
            );

            // Apply the operation
            switch (operation) {
                case WITHIN:
                    return cb.lessThanOrEqualTo(distanceExpression, distanceKm);
                case OUTSIDE:
                    return cb.greaterThan(distanceExpression, distanceKm);
                default:
                    throw new IllegalStateException("Unknown operation: " + operation);
            }
        };
    }

    /**
     * Creates a Haversine distance calculation expression for JPA Criteria API.
     * OPTIMIZED VERSION - Pre-calculates constants in Java to avoid SQL complexity.
     */
    private Expression<Double> createHaversineExpression(
            CriteriaBuilder cb,
            Path<Double> targetLat, Path<Double> targetLon,
            double refLat, double refLon) {
        
        // Pre-calculate reference values in Java (NOT in SQL) - this is KEY
        double lat1Rad = Math.toRadians(refLat);
        double lon1Rad = Math.toRadians(refLon);
        double cosLat1 = Math.cos(lat1Rad);
        double sinLat1 = Math.sin(lat1Rad);
        
        // Convert target coordinates to radians (in SQL)
        Expression<Double> lat2Rad = cb.prod(targetLat, Math.PI / 180.0);
        Expression<Double> lon2Rad = cb.prod(targetLon, Math.PI / 180.0);
        
        // Calculate cos and sin for target latitude (in SQL)
        Expression<Double> cosLat2 = cb.function("cos", Double.class, lat2Rad);
        Expression<Double> sinLat2 = cb.function("sin", Double.class, lat2Rad);
        
        // Calculate longitude difference
        Expression<Double> lonDiff = cb.diff(lon2Rad, lon1Rad);
        Expression<Double> cosLonDiff = cb.function("cos", Double.class, lonDiff);
        
        // Simplified Haversine formula:
        // a = cos(lat1) * cos(lat2) * cos(lon2-lon1) + sin(lat1) * sin(lat2)
        Expression<Double> term1 = cb.prod(cosLat1, cb.prod(cosLat2, cosLonDiff));
        Expression<Double> term2 = cb.prod(sinLat1, sinLat2);
        Expression<Double> a = cb.sum(term1, term2);
        
        // Clamp 'a' to [-1, 1] range to prevent acos domain errors
        // This is CRITICAL - without it, floating point errors cause acos to fail
        Expression<Double> aUpper = cb.function("least", Double.class, cb.literal(1.0), a);
        Expression<Double> aClamped = cb.function("greatest", Double.class, cb.literal(-1.0), aUpper);
        
        // distance = R * acos(a)  where R = 6371 km (Earth's radius)
        Expression<Double> acosValue = cb.function("acos", Double.class, aClamped);
        
        return cb.prod(6371.0, acosValue);
    }

    // Getters
    public Location getReferenceLocation() { 
        return referenceLocation; 
    }
    
    public double getDistanceKm() { 
        return distanceKm; 
    }
    
    public Operation getOperation() { 
        return operation; 
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        LocationFilter that = (LocationFilter) obj;
        return Double.compare(that.distanceKm, distanceKm) == 0 &&
               Objects.equals(referenceLocation, that.referenceLocation) &&
               operation == that.operation;
    }

    @Override
    public int hashCode() {
        return Objects.hash(referenceLocation, distanceKm, operation);
    }

    @Override
    public String toString() {
        return String.format("LocationFilter{reference=%s, distance=%.2fkm, operation=%s}", 
                           referenceLocation, distanceKm, operation);
    }
}