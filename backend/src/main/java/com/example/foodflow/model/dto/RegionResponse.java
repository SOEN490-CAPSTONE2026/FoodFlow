package com.example.foodflow.model.dto;

public class RegionResponse {
    
    private String country;
    private String city;
    private String timezone;
    private String timezoneOffset;
    
    // Constructors
    public RegionResponse() {}
    
    public RegionResponse(String country, String city, String timezone, String timezoneOffset) {
        this.country = country;
        this.city = city;
        this.timezone = timezone;
        this.timezoneOffset = timezoneOffset;
    }
    
    // Getters and setters
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getTimezone() {
        return timezone;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
    
    public String getTimezoneOffset() {
        return timezoneOffset;
    }
    
    public void setTimezoneOffset(String timezoneOffset) {
        this.timezoneOffset = timezoneOffset;
    }
}
