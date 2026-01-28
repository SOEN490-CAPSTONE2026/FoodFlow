package com.example.foodflow.model.dto;

import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class UserRelatedDTOTest {
    
    @Test
    void userDTO_GettersAndSetters_ShouldWork() {
        UserDTO dto = new UserDTO();
        LocalDateTime now = LocalDateTime.now();
        
        dto.setId(1L);
        dto.setEmail("test@test.com");
        dto.setPassword("password");
        dto.setRole(UserRole.DONOR);
        dto.setCreatedAt(now);
        dto.setUpdatedAt(now);
        dto.setEmailNotificationsEnabled(true);
        dto.setSmsNotificationsEnabled(false);
        
        assertEquals(1L, dto.getId());
        assertEquals("test@test.com", dto.getEmail());
        assertEquals("password", dto.getPassword());
        assertEquals(UserRole.DONOR, dto.getRole());
        assertEquals(now, dto.getCreatedAt());
        assertEquals(now, dto.getUpdatedAt());
        assertTrue(dto.getEmailNotificationsEnabled());
        assertFalse(dto.getSmsNotificationsEnabled());
    }
    
    @Test
    void userDTO_ToDTO_WithNullUser_ReturnsNull() {
        UserDTO result = UserDTO.toDTO(null);
        assertNull(result);
    }
    
    @Test
    void organizationDTO_GettersAndSetters_ShouldWork() {
        OrganizationDTO dto = new OrganizationDTO();
        
        dto.setId(1L);
        dto.setName("Test Org");
        dto.setAddress("123 Main St");
        dto.setPhone("+1234567890");
        
        assertEquals(1L, dto.getId());
        assertEquals("Test Org", dto.getName());
        assertEquals("123 Main St", dto.getAddress());
        assertEquals("+1234567890", dto.getPhone());
    }
    
    @Test
    void organizationDTO_ToDTO_WithNullOrg_ReturnsNull() {
        OrganizationDTO result = OrganizationDTO.toDTO(null);
        assertNull(result);
    }
    
    @Test
    void userProfileResponse_GettersAndSetters_ShouldWork() {
        UserProfileResponse response = new UserProfileResponse();
        
        response.setEmail("user@test.com");
        response.setFullName("John Doe");
        response.setPhone("+1234567890");
        response.setOrganizationName("Test Org");
        response.setAddress("123 Main St");
        
        assertEquals("user@test.com", response.getEmail());
        assertEquals("John Doe", response.getFullName());
        assertEquals("+1234567890", response.getPhone());
        assertEquals("Test Org", response.getOrganizationName());
        assertEquals("123 Main St", response.getAddress());
    }
    
    @Test
    void updateProfileRequest_GettersAndSetters_ShouldWork() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        
        request.setFullName("Jane Doe");
        request.setOrganizationName("New Org");
        
        assertEquals("Jane Doe", request.getFullName());
        assertEquals("New Org", request.getOrganizationName());
    }
    
    @Test
    void regionResponse_GettersAndSetters_ShouldWork() {
        RegionResponse response = new RegionResponse();
        
        response.setCountry("Canada");
        response.setCity("Montreal");
        response.setTimezone("America/Toronto");
        response.setTimezoneOffset("-05:00");
        
        assertEquals("Canada", response.getCountry());
        assertEquals("Montreal", response.getCity());
        assertEquals("America/Toronto", response.getTimezone());
        assertEquals("-05:00", response.getTimezoneOffset());
    }
    
    @Test
    void updateRegionRequest_GettersAndSetters_ShouldWork() {
        UpdateRegionRequest request = new UpdateRegionRequest();
        
        request.setCountry("USA");
        request.setCity("New York");
        
        assertEquals("USA", request.getCountry());
        assertEquals("New York", request.getCity());
    }
    
    
    
}
