package com.example.foodflow.util;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for resolving timezone IDs from city and country combinations.
 * This provides a mapping between major cities and their timezone identifiers.
 */
public class TimezoneResolver {
    
    // Static mapping of major cities to timezone IDs
    private static final Map<String, String> CITY_TIMEZONE_MAP = new HashMap<>();
    
    static {
        // North America - Canada
        CITY_TIMEZONE_MAP.put("Toronto|Canada", "America/Toronto");
        CITY_TIMEZONE_MAP.put("Vancouver|Canada", "America/Vancouver");
        CITY_TIMEZONE_MAP.put("Montreal|Canada", "America/Toronto");
        CITY_TIMEZONE_MAP.put("Calgary|Canada", "America/Edmonton");
        CITY_TIMEZONE_MAP.put("Ottawa|Canada", "America/Toronto");
        CITY_TIMEZONE_MAP.put("Edmonton|Canada", "America/Edmonton");
        CITY_TIMEZONE_MAP.put("Winnipeg|Canada", "America/Winnipeg");
        CITY_TIMEZONE_MAP.put("Quebec City|Canada", "America/Toronto");
        CITY_TIMEZONE_MAP.put("Halifax|Canada", "America/Halifax");
        
        // North America - United States
        CITY_TIMEZONE_MAP.put("New York|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("Los Angeles|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Chicago|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("Houston|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("Phoenix|United States", "America/Phoenix");
        CITY_TIMEZONE_MAP.put("Philadelphia|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("San Antonio|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("San Diego|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Dallas|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("San Jose|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Austin|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("Jacksonville|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("Fort Worth|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("Columbus|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("Charlotte|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("San Francisco|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Indianapolis|United States", "America/Indiana/Indianapolis");
        CITY_TIMEZONE_MAP.put("Seattle|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Denver|United States", "America/Denver");
        CITY_TIMEZONE_MAP.put("Washington|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("Boston|United States", "America/New_York");
        CITY_TIMEZONE_MAP.put("Nashville|United States", "America/Chicago");
        CITY_TIMEZONE_MAP.put("Detroit|United States", "America/Detroit");
        CITY_TIMEZONE_MAP.put("Portland|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Las Vegas|United States", "America/Los_Angeles");
        CITY_TIMEZONE_MAP.put("Miami|United States", "America/New_York");
        
        // Europe - United Kingdom
        CITY_TIMEZONE_MAP.put("London|United Kingdom", "Europe/London");
        CITY_TIMEZONE_MAP.put("Manchester|United Kingdom", "Europe/London");
        CITY_TIMEZONE_MAP.put("Birmingham|United Kingdom", "Europe/London");
        CITY_TIMEZONE_MAP.put("Glasgow|United Kingdom", "Europe/London");
        CITY_TIMEZONE_MAP.put("Edinburgh|United Kingdom", "Europe/London");
        
        // Europe - France
        CITY_TIMEZONE_MAP.put("Paris|France", "Europe/Paris");
        CITY_TIMEZONE_MAP.put("Marseille|France", "Europe/Paris");
        CITY_TIMEZONE_MAP.put("Lyon|France", "Europe/Paris");
        CITY_TIMEZONE_MAP.put("Toulouse|France", "Europe/Paris");
        CITY_TIMEZONE_MAP.put("Nice|France", "Europe/Paris");
        
        // Europe - Germany
        CITY_TIMEZONE_MAP.put("Berlin|Germany", "Europe/Berlin");
        CITY_TIMEZONE_MAP.put("Hamburg|Germany", "Europe/Berlin");
        CITY_TIMEZONE_MAP.put("Munich|Germany", "Europe/Berlin");
        CITY_TIMEZONE_MAP.put("Cologne|Germany", "Europe/Berlin");
        CITY_TIMEZONE_MAP.put("Frankfurt|Germany", "Europe/Berlin");
        
        // Europe - Italy
        CITY_TIMEZONE_MAP.put("Rome|Italy", "Europe/Rome");
        CITY_TIMEZONE_MAP.put("Milan|Italy", "Europe/Rome");
        CITY_TIMEZONE_MAP.put("Naples|Italy", "Europe/Rome");
        CITY_TIMEZONE_MAP.put("Turin|Italy", "Europe/Rome");
        CITY_TIMEZONE_MAP.put("Florence|Italy", "Europe/Rome");
        
        // Europe - Spain
        CITY_TIMEZONE_MAP.put("Madrid|Spain", "Europe/Madrid");
        CITY_TIMEZONE_MAP.put("Barcelona|Spain", "Europe/Madrid");
        CITY_TIMEZONE_MAP.put("Valencia|Spain", "Europe/Madrid");
        CITY_TIMEZONE_MAP.put("Seville|Spain", "Europe/Madrid");
        
        // Europe - Others
        CITY_TIMEZONE_MAP.put("Amsterdam|Netherlands", "Europe/Amsterdam");
        CITY_TIMEZONE_MAP.put("Brussels|Belgium", "Europe/Brussels");
        CITY_TIMEZONE_MAP.put("Vienna|Austria", "Europe/Vienna");
        CITY_TIMEZONE_MAP.put("Zurich|Switzerland", "Europe/Zurich");
        CITY_TIMEZONE_MAP.put("Stockholm|Sweden", "Europe/Stockholm");
        CITY_TIMEZONE_MAP.put("Copenhagen|Denmark", "Europe/Copenhagen");
        CITY_TIMEZONE_MAP.put("Oslo|Norway", "Europe/Oslo");
        CITY_TIMEZONE_MAP.put("Helsinki|Finland", "Europe/Helsinki");
        CITY_TIMEZONE_MAP.put("Dublin|Ireland", "Europe/Dublin");
        CITY_TIMEZONE_MAP.put("Lisbon|Portugal", "Europe/Lisbon");
        CITY_TIMEZONE_MAP.put("Prague|Czech Republic", "Europe/Prague");
        CITY_TIMEZONE_MAP.put("Warsaw|Poland", "Europe/Warsaw");
        CITY_TIMEZONE_MAP.put("Budapest|Hungary", "Europe/Budapest");
        CITY_TIMEZONE_MAP.put("Athens|Greece", "Europe/Athens");
        
        // Asia - East Asia
        CITY_TIMEZONE_MAP.put("Tokyo|Japan", "Asia/Tokyo");
        CITY_TIMEZONE_MAP.put("Osaka|Japan", "Asia/Tokyo");
        CITY_TIMEZONE_MAP.put("Beijing|China", "Asia/Shanghai");
        CITY_TIMEZONE_MAP.put("Shanghai|China", "Asia/Shanghai");
        CITY_TIMEZONE_MAP.put("Guangzhou|China", "Asia/Shanghai");
        CITY_TIMEZONE_MAP.put("Shenzhen|China", "Asia/Shanghai");
        CITY_TIMEZONE_MAP.put("Seoul|South Korea", "Asia/Seoul");
        CITY_TIMEZONE_MAP.put("Hong Kong|Hong Kong", "Asia/Hong_Kong");
        CITY_TIMEZONE_MAP.put("Taipei|Taiwan", "Asia/Taipei");
        
        // Asia - Southeast Asia
        CITY_TIMEZONE_MAP.put("Singapore|Singapore", "Asia/Singapore");
        CITY_TIMEZONE_MAP.put("Bangkok|Thailand", "Asia/Bangkok");
        CITY_TIMEZONE_MAP.put("Jakarta|Indonesia", "Asia/Jakarta");
        CITY_TIMEZONE_MAP.put("Manila|Philippines", "Asia/Manila");
        CITY_TIMEZONE_MAP.put("Kuala Lumpur|Malaysia", "Asia/Kuala_Lumpur");
        CITY_TIMEZONE_MAP.put("Hanoi|Vietnam", "Asia/Ho_Chi_Minh");
        CITY_TIMEZONE_MAP.put("Ho Chi Minh City|Vietnam", "Asia/Ho_Chi_Minh");
        
        // Asia - South Asia
        CITY_TIMEZONE_MAP.put("Mumbai|India", "Asia/Kolkata");
        CITY_TIMEZONE_MAP.put("Delhi|India", "Asia/Kolkata");
        CITY_TIMEZONE_MAP.put("Bangalore|India", "Asia/Kolkata");
        CITY_TIMEZONE_MAP.put("Kolkata|India", "Asia/Kolkata");
        CITY_TIMEZONE_MAP.put("Chennai|India", "Asia/Kolkata");
        CITY_TIMEZONE_MAP.put("Karachi|Pakistan", "Asia/Karachi");
        CITY_TIMEZONE_MAP.put("Dhaka|Bangladesh", "Asia/Dhaka");
        
        // Asia - Middle East
        CITY_TIMEZONE_MAP.put("Dubai|United Arab Emirates", "Asia/Dubai");
        CITY_TIMEZONE_MAP.put("Abu Dhabi|United Arab Emirates", "Asia/Dubai");
        CITY_TIMEZONE_MAP.put("Riyadh|Saudi Arabia", "Asia/Riyadh");
        CITY_TIMEZONE_MAP.put("Tel Aviv|Israel", "Asia/Jerusalem");
        CITY_TIMEZONE_MAP.put("Jerusalem|Israel", "Asia/Jerusalem");
        CITY_TIMEZONE_MAP.put("Istanbul|Turkey", "Europe/Istanbul");
        CITY_TIMEZONE_MAP.put("Ankara|Turkey", "Europe/Istanbul");
        
        // Oceania
        CITY_TIMEZONE_MAP.put("Sydney|Australia", "Australia/Sydney");
        CITY_TIMEZONE_MAP.put("Melbourne|Australia", "Australia/Melbourne");
        CITY_TIMEZONE_MAP.put("Brisbane|Australia", "Australia/Brisbane");
        CITY_TIMEZONE_MAP.put("Perth|Australia", "Australia/Perth");
        CITY_TIMEZONE_MAP.put("Adelaide|Australia", "Australia/Adelaide");
        CITY_TIMEZONE_MAP.put("Auckland|New Zealand", "Pacific/Auckland");
        CITY_TIMEZONE_MAP.put("Wellington|New Zealand", "Pacific/Auckland");
        
        // South America
        CITY_TIMEZONE_MAP.put("São Paulo|Brazil", "America/Sao_Paulo");
        CITY_TIMEZONE_MAP.put("Rio de Janeiro|Brazil", "America/Sao_Paulo");
        CITY_TIMEZONE_MAP.put("Brasília|Brazil", "America/Sao_Paulo");
        CITY_TIMEZONE_MAP.put("Buenos Aires|Argentina", "America/Argentina/Buenos_Aires");
        CITY_TIMEZONE_MAP.put("Lima|Peru", "America/Lima");
        CITY_TIMEZONE_MAP.put("Bogotá|Colombia", "America/Bogota");
        CITY_TIMEZONE_MAP.put("Santiago|Chile", "America/Santiago");
        CITY_TIMEZONE_MAP.put("Caracas|Venezuela", "America/Caracas");
        
        // Africa
        CITY_TIMEZONE_MAP.put("Cairo|Egypt", "Africa/Cairo");
        CITY_TIMEZONE_MAP.put("Lagos|Nigeria", "Africa/Lagos");
        CITY_TIMEZONE_MAP.put("Johannesburg|South Africa", "Africa/Johannesburg");
        CITY_TIMEZONE_MAP.put("Nairobi|Kenya", "Africa/Nairobi");
        CITY_TIMEZONE_MAP.put("Casablanca|Morocco", "Africa/Casablanca");
        CITY_TIMEZONE_MAP.put("Accra|Ghana", "Africa/Accra");
        CITY_TIMEZONE_MAP.put("Addis Ababa|Ethiopia", "Africa/Addis_Ababa");
        
        // Mexico and Central America
        CITY_TIMEZONE_MAP.put("Mexico City|Mexico", "America/Mexico_City");
        CITY_TIMEZONE_MAP.put("Guadalajara|Mexico", "America/Mexico_City");
        CITY_TIMEZONE_MAP.put("Monterrey|Mexico", "America/Monterrey");
    }
    
    /**
     * Resolves timezone ID from city and country combination.
     * 
     * @param city City name
     * @param country Country name
     * @return Timezone ID (e.g., "America/Toronto") or "UTC" if not found
     */
    public static String resolveTimezone(String city, String country) {
        if (city == null || country == null) {
            return "UTC";
        }
        
        String key = city.trim() + "|" + country.trim();
        String timezone = CITY_TIMEZONE_MAP.get(key);
        
        // If city not found, fallback to country-level default
        if (timezone == null) {
            timezone = getCountryDefaultTimezone(country.trim());
        }
        
        return timezone;
    }
    
    /**
     * Gets the default timezone for a country when specific city is not mapped.
     * 
     * @param country Country name
     * @return Default timezone for the country or "UTC" if not found
     */
    private static String getCountryDefaultTimezone(String country) {
        // North America
        if ("Canada".equalsIgnoreCase(country)) {
            return "America/Toronto"; // Most populous timezone
        }
        if ("United States".equalsIgnoreCase(country) || "USA".equalsIgnoreCase(country)) {
            return "America/New_York"; // Eastern Time (most populous)
        }
        if ("Mexico".equalsIgnoreCase(country)) {
            return "America/Mexico_City";
        }
        
        // Europe
        if ("United Kingdom".equalsIgnoreCase(country) || "UK".equalsIgnoreCase(country)) {
            return "Europe/London";
        }
        if ("France".equalsIgnoreCase(country)) {
            return "Europe/Paris";
        }
        if ("Germany".equalsIgnoreCase(country)) {
            return "Europe/Berlin";
        }
        if ("Italy".equalsIgnoreCase(country)) {
            return "Europe/Rome";
        }
        if ("Spain".equalsIgnoreCase(country)) {
            return "Europe/Madrid";
        }
        
        // Asia
        if ("Japan".equalsIgnoreCase(country)) {
            return "Asia/Tokyo";
        }
        if ("China".equalsIgnoreCase(country)) {
            return "Asia/Shanghai";
        }
        if ("India".equalsIgnoreCase(country)) {
            return "Asia/Kolkata";
        }
        if ("Singapore".equalsIgnoreCase(country)) {
            return "Asia/Singapore";
        }
        
        // Oceania
        if ("Australia".equalsIgnoreCase(country)) {
            return "Australia/Sydney";
        }
        if ("New Zealand".equalsIgnoreCase(country)) {
            return "Pacific/Auckland";
        }
        
        // South America
        if ("Brazil".equalsIgnoreCase(country)) {
            return "America/Sao_Paulo";
        }
        if ("Argentina".equalsIgnoreCase(country)) {
            return "America/Argentina/Buenos_Aires";
        }
        
        // Default fallback
        return "UTC";
    }
    
    /**
     * Gets the current UTC offset for a given timezone.
     * 
     * @param timezoneId Timezone identifier (e.g., "America/Toronto")
     * @return Offset string (e.g., "-05:00" or "+00:00")
     */
    public static String getTimezoneOffset(String timezoneId) {
        if (timezoneId == null || timezoneId.trim().isEmpty()) {
            return "+00:00";
        }
        
        try {
            ZoneId zoneId = ZoneId.of(timezoneId);
            ZonedDateTime now = ZonedDateTime.now(zoneId);
            return now.getOffset().getId();
        } catch (Exception e) {
            return "+00:00";
        }
    }
    
    /**
     * Checks if a timezone ID is valid.
     * 
     * @param timezoneId Timezone identifier to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidTimezone(String timezoneId) {
        if (timezoneId == null || timezoneId.trim().isEmpty()) {
            return false;
        }
        
        try {
            ZoneId.of(timezoneId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Converts a UTC offset string (e.g., "UTC-05:00", "UTC+03:30") to a representative IANA timezone ID.
     * 
     * @param offsetString The UTC offset string
     * @return IANA timezone ID, or "UTC" if no match found
     */
    public static String convertOffsetToTimezone(String offsetString) {
        if (offsetString == null || offsetString.trim().isEmpty()) {
            return "UTC";
        }
        
        String normalized = offsetString.trim().toUpperCase();
        
        // Remove "UTC" or "GMT" prefix
        if (normalized.startsWith("UTC")) {
            normalized = normalized.substring(3);
        } else if (normalized.startsWith("GMT")) {
            normalized = normalized.substring(3);
        } else {
            return "UTC";
        }
        
        // Map UTC offsets to representative IANA timezones
        // Format: UTC±HH:MM
        switch (normalized) {
            // Negative offsets (Western Hemisphere)
            case "-12:00": return "Pacific/Baker_Island";
            case "-11:00": return "Pacific/Pago_Pago";
            case "-10:00": return "Pacific/Honolulu";
            case "-09:30": return "Pacific/Marquesas";
            case "-09:00": return "America/Anchorage";
            case "-08:00": return "America/Los_Angeles";
            case "-07:00": return "America/Denver";
            case "-06:00": return "America/Chicago";
            case "-05:00": return "America/New_York";
            case "-04:00": return "America/Halifax";
            case "-03:30": return "America/St_Johns";
            case "-03:00": return "America/Argentina/Buenos_Aires";
            case "-02:00": return "Atlantic/South_Georgia";
            case "-01:00": return "Atlantic/Azores";
            
            // Zero offset
            case "+00:00":
            case "-00:00":
            case "": return "UTC";
            
            // Positive offsets (Eastern Hemisphere)
            case "+01:00": return "Europe/London";
            case "+02:00": return "Europe/Paris";
            case "+03:00": return "Europe/Moscow";
            case "+03:30": return "Asia/Tehran";
            case "+04:00": return "Asia/Dubai";
            case "+04:30": return "Asia/Kabul";
            case "+05:00": return "Asia/Karachi";
            case "+05:30": return "Asia/Kolkata";
            case "+05:45": return "Asia/Kathmandu";
            case "+06:00": return "Asia/Dhaka";
            case "+06:30": return "Asia/Yangon";
            case "+07:00": return "Asia/Bangkok";
            case "+08:00": return "Asia/Shanghai";
            case "+08:30": return "Asia/Pyongyang";
            case "+08:45": return "Australia/Eucla";
            case "+09:00": return "Asia/Tokyo";
            case "+09:30": return "Australia/Darwin";
            case "+10:00": return "Australia/Sydney";
            case "+10:30": return "Australia/Lord_Howe";
            case "+11:00": return "Pacific/Guadalcanal";
            case "+12:00": return "Pacific/Auckland";
            case "+12:45": return "Pacific/Chatham";
            case "+13:00": return "Pacific/Tongatapu";
            case "+14:00": return "Pacific/Kiritimati";
            
            default:
                // If format doesn't match, return UTC
                return "UTC";
        }
    }
    
    /**
     * Converts a LocalDateTime from one timezone to another.
     * 
     * @param dateTime The date-time to convert
     * @param fromTimezone Source timezone (e.g., "America/Toronto")
     * @param toTimezone Target timezone (e.g., "UTC")
     * @return Converted LocalDateTime in target timezone
     */
    public static java.time.LocalDateTime convertTimezone(
            java.time.LocalDateTime dateTime, 
            String fromTimezone, 
            String toTimezone) {
        
        if (dateTime == null) {
            return null;
        }
        
        try {
            ZoneId fromZone = ZoneId.of(fromTimezone != null ? fromTimezone : "UTC");
            ZoneId toZone = ZoneId.of(toTimezone != null ? toTimezone : "UTC");
            
            // Convert LocalDateTime to ZonedDateTime in source timezone
            ZonedDateTime zonedDateTime = dateTime.atZone(fromZone);
            
            // Convert to target timezone
            ZonedDateTime convertedDateTime = zonedDateTime.withZoneSameInstant(toZone);
            
            // Return as LocalDateTime (strips timezone info but represents correct time)
            return convertedDateTime.toLocalDateTime();
        } catch (Exception e) {
            // If conversion fails, return original
            return dateTime;
        }
    }
    
    /**
     * Converts LocalDate and LocalTime from one timezone to another, returning LocalDateTime.
     * 
     * @param date The date
     * @param time The time
     * @param fromTimezone Source timezone
     * @param toTimezone Target timezone
     * @return Converted LocalDateTime in target timezone
     */
    public static java.time.LocalDateTime convertDateTime(
            java.time.LocalDate date,
            java.time.LocalTime time,
            String fromTimezone,
            String toTimezone) {
        
        if (date == null || time == null) {
            return null;
        }
        
        java.time.LocalDateTime dateTime = java.time.LocalDateTime.of(date, time);
        return convertTimezone(dateTime, fromTimezone, toTimezone);
    }
}
