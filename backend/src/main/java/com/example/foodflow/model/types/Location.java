package com.example.foodflow.model.types;


import jakarta.persistence.Embeddable;
import java.util.Objects;

@Embeddable
public class Location {

    private Double latitude;
    private Double longitude;
    private String address;

    public Location() {} // JPA requirement

    public Location(Double latitude, Double longitude, String address) {
        this.latitude = Objects.requireNonNull(latitude);
        this.longitude = Objects.requireNonNull(longitude);
        this.address = address;
    }

    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getAddress() { return address; }

    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setAddress(String address) { this.address = address; }

    @Override
    public String toString() {
        return address + " (" + latitude + ", " + longitude + ")";
    }

    // Optional helper for distance (Haversine formula)
    public double distanceTo(Location other) {
        final int R = 6371; // km
        double latDistance = Math.toRadians(other.latitude - this.latitude);
        double lonDistance = Math.toRadians(other.longitude - this.longitude);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(this.latitude)) * Math.cos(Math.toRadians(other.latitude))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // distance in km
    }
}
