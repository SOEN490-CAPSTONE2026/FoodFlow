package com.example.foodflow.dto;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;


class UserDTOTest {

    @Test
    void testToDTO() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("secret");
        user.setRole(UserRole.DONOR);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        Organization org = new Organization();
        org.setId(10L);
        org.setName("Charity Org");
        user.setOrganization(org);

        UserDTO dto = UserDTO.toDTO(user);

        assertEquals(1L, dto.getId());
        assertEquals("test@example.com", dto.getEmail());
        assertNull(dto.getPassword());
        assertEquals(UserRole.DONOR, dto.getRole());
        assertNotNull(dto.getOrganization());
        assertEquals(10L, dto.getOrganization().getId());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        String json = mapper.writeValueAsString(dto);
        assertTrue(json.contains("id"));
        assertTrue(json.contains("email"));
        assertFalse(json.contains("password"));
    }
}
