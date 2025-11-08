package com.example.foodflow.helpers;

import com.example.foodflow.model.types.Location;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.CriteriaBuilder;

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
        WITHIN,                    // distance <= maxDistance
        OUTSIDE,                   // distance > maxDistance  
        EXACTLY,                   // distance == exactDistance (with tolerance)
        GREATER_THAN,              // distance > minDistance
        GREATER_THAN_OR_EQUAL,     // distance >= minDistance
        LESS_THAN,                 // distance < maxDistance
        LESS_THAN_OR_EQUAL         // distance <= maxDistance
    }

    private final Location referenceLocation;  // the location to measure from
    private final double distanceKm;           // distance in kilometers
    private final Operation operation;         // operation type
    private final double tolerance;            // tolerance for EXACTLY operation (default: 0.1 km)

    /**
     * Private constructor to enforce static factory methods usage.
     */
    protected LocationFilter(Location referenceLocation, double distanceKm, Operation operation, double tolerance) {
        this.referenceLocation = Objects.requireNonNull(referenceLocation, "Reference location cannot be null");
        if (distanceKm < 0) {
            throw new IllegalArgumentException("Distance cannot be negative");
        }
        if (tolerance < 0) {
            throw new IllegalArgumentException("Tolerance cannot be negative");
        }
        
        this.distanceKm = distanceKm;
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
        this.tolerance = tolerance;
    }

    // ---------------- Static factory methods ----------------

    /**
     * Filter for locations within a certain distance (inclusive).
     */
    public static LocationFilter within(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.WITHIN, 0.1);
    }

    /**
     * Filter for locations outside a certain distance (exclusive).
     */
    public static LocationFilter outside(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.OUTSIDE, 0.1);
    }

    /**
     * Filter for locations at exactly a certain distance (with default tolerance of 0.1km).
     */
    public static LocationFilter exactly(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.EXACTLY, 0.1);
    }

    /**
     * Filter for locations at exactly a certain distance (with custom tolerance).
     */
    public static LocationFilter exactly(Location referenceLocation, double distanceKm, double toleranceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.EXACTLY, toleranceKm);
    }

    /**
     * Filter for locations greater than a certain distance.
     */
    public static LocationFilter greaterThan(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.GREATER_THAN, 0.1);
    }

    /**
     * Filter for locations greater than or equal to a certain distance.
     */
    public static LocationFilter greaterThanOrEqual(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.GREATER_THAN_OR_EQUAL, 0.1);
    }

    /**
     * Filter for locations less than a certain distance.
     */
    public static LocationFilter lessThan(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.LESS_THAN, 0.1);
    }

    /**
     * Filter for locations less than or equal to a certain distance.
     */
    public static LocationFilter lessThanOrEqual(Location referenceLocation, double distanceKm) {
        return new LocationFilter(referenceLocation, distanceKm, Operation.LESS_THAN_OR_EQUAL, 0.1);
    }

    // ---------------- In-memory check ----------------

    /**
     * Check if a location satisfies this distance filter.
     * @param targetLocation the location to check
     * @return true if the location satisfies the filter
     */
    public boolean check(Location targetLocation) {
        Objects.requireNonNull(targetLocation, "Target location cannot be null");

        double actualDistance = referenceLocation.distanceTo(targetLocation);

        switch (operation) {
            case WITHIN:
            case LESS_THAN_OR_EQUAL:
                return actualDistance <= distanceKm;
                
            case OUTSIDE:
            case GREATER_THAN:
                return actualDistance > distanceKm;
                
            case EXACTLY:
                return Math.abs(actualDistance - distanceKm) <= tolerance;
                
            case GREATER_THAN_OR_EQUAL:
                return actualDistance >= distanceKm;
                
            case LESS_THAN:
                return actualDistance < distanceKm;
                
            default:
                throw new IllegalStateException("Unknown operation: " + operation);
        }
    }

    @Override
    public <E> Specification<E> toSpecification(String fieldName) {
        return (root, query, cb) -> {
            // Get the location field path
            Path<Location> locationPath = root.get(fieldName);
            Path<Double> latPath = locationPath.get("latitude");
            Path<Double> lonPath = locationPath.get("longitude");

            // Create Haversine distance calculation expression
            Expression<Double> distanceExpression = createHaversineExpression(
                cb, latPath, lonPath, 
                referenceLocation.getLatitude(), 
                referenceLocation.getLongitude()
            );

            switch (operation) {
                case WITHIN:
                case LESS_THAN_OR_EQUAL:
                    return cb.lessThanOrEqualTo(distanceExpression, distanceKm);
                    
                case OUTSIDE:
                case GREATER_THAN:
                    return cb.greaterThan(distanceExpression, distanceKm);
                    
                case EXACTLY:
                    return cb.and(
                        cb.greaterThanOrEqualTo(distanceExpression, distanceKm - tolerance),
                        cb.lessThanOrEqualTo(distanceExpression, distanceKm + tolerance)
                    );
                    
                case GREATER_THAN_OR_EQUAL:
                    return cb.greaterThanOrEqualTo(distanceExpression, distanceKm);
                    
                case LESS_THAN:
                    return cb.lessThan(distanceExpression, distanceKm);
                    
                default:
                    throw new IllegalStateException("Unknown operation: " + operation);
            }
        };
    }

    /**
     * Creates a Haversine distance calculation expression for JPA Criteria API.
     * This creates the SQL equivalent of the Haversine formula.
     */
    private Expression<Double> createHaversineExpression(
            CriteriaBuilder cb,
            Path<Double> targetLat, Path<Double> targetLon,
            double refLat, double refLon) {
        
        // Convert to radians
        Expression<Double> refLatRad = cb.literal(Math.toRadians(refLat));
        Expression<Double> refLonRad = cb.literal(Math.toRadians(refLon));
        Expression<Double> targetLatRad = cb.prod(cb.literal(Math.PI / 180.0), targetLat);
        Expression<Double> targetLonRad = cb.prod(cb.literal(Math.PI / 180.0), targetLon);
        
        // Calculate differences
        Expression<Double> latDiff = cb.diff(targetLatRad, refLatRad);
        Expression<Double> lonDiff = cb.diff(targetLonRad, refLonRad);
        
        // Haversine formula components
        // sin²(Δlat/2)
        Expression<Double> sinLatHalf = cb.function("SIN", Double.class, cb.quot(latDiff, cb.literal(2.0)));
        Expression<Double> sinLatHalfSq = cb.prod(sinLatHalf, sinLatHalf);
        
        // sin²(Δlon/2)
        Expression<Double> sinLonHalf = cb.function("SIN", Double.class, cb.quot(lonDiff, cb.literal(2.0)));
        Expression<Double> sinLonHalfSq = cb.prod(sinLonHalf, sinLonHalf);
        
        // cos(lat1) * cos(lat2)
        Expression<Double> cosRefLat = cb.function("COS", Double.class, refLatRad);
        Expression<Double> cosTargetLat = cb.function("COS", Double.class, targetLatRad);
        Expression<Double> cosProduct = cb.prod(cosRefLat, cosTargetLat);
        
        // a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
        Expression<Double> a = cb.sum(sinLatHalfSq, cb.prod(cosProduct, sinLonHalfSq));
        
        // c = 2 * atan2(√a, √(1-a))
        Expression<Double> sqrtA = cb.function("SQRT", Double.class, a);
        Expression<Double> sqrt1MinusA = cb.function("SQRT", Double.class, cb.diff(cb.literal(1.0), a));
        Expression<Double> atan2 = cb.function("ATAN2", Double.class, sqrtA, sqrt1MinusA);
        Expression<Double> c = cb.prod(cb.literal(2.0), atan2);
        
        // distance = R * c (R = 6371 km)
        return cb.prod(cb.literal(6371.0), c);
    }

    // ---------------- Getters ----------------
    
    public Location getReferenceLocation() { 
        return referenceLocation; 
    }
    
    public double getDistanceKm() { 
        return distanceKm; 
    }
    
    public Operation getOperation() { 
        return operation; 
    }
    
    public double getTolerance() { 
        return tolerance; 
    }

    // ---------------- Object methods ----------------

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        LocationFilter that = (LocationFilter) obj;
        return Double.compare(that.distanceKm, distanceKm) == 0 &&
               Double.compare(that.tolerance, tolerance) == 0 &&
               Objects.equals(referenceLocation, that.referenceLocation) &&
               operation == that.operation;
    }

    @Override
    public int hashCode() {
        return Objects.hash(referenceLocation, distanceKm, operation, tolerance);
    }

    @Override
    public String toString() {
        return String.format("LocationFilter{reference=%s, distance=%.2fkm, operation=%s, tolerance=%.2fkm}", 
                           referenceLocation, distanceKm, operation, tolerance);
    }
}