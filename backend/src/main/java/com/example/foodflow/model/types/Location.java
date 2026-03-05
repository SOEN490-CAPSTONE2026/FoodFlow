package com.example.foodflow.model.types;


import jakarta.persistence.Embeddable;
import java.util.Objects;

@Embeddable
public class Location {

    private Double latitude;
    private Double longitude;
    private String address;
    private String country; // Full country name (e.g., "Canada", "United States")

    public Location() {} // JPA requirement

    public Location(Double latitude, Double longitude, String address) {
        this.latitude = Objects.requireNonNull(latitude);
        this.longitude = Objects.requireNonNull(longitude);
        this.address = address;
    }

    public Location(Double latitude, Double longitude, String address, String country) {
        this.latitude = Objects.requireNonNull(latitude);
        this.longitude = Objects.requireNonNull(longitude);
        this.address = address;
        this.country = country;
    }

    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getAddress() { return address; }
    public String getCountry() { return country; }

    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setAddress(String address) { this.address = address; }
    public void setCountry(String country) { this.country = country; }

    @Override
    public String toString() {
        String countryPart = country != null ? ", " + country : "";
        return address + " (" + latitude + ", " + longitude + countryPart + ")";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Location)) return false;
        Location that = (Location) o;
        return Objects.equals(latitude, that.latitude) &&
            Objects.equals(longitude, that.longitude);
    }

    @Override
    public int hashCode() {
        return Objects.hash(latitude, longitude);
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
