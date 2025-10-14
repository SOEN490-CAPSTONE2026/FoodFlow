package com.example.foodflow.dto;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.model.dto.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class OrganizationDTOTest {

    @Test
    void testToDTO() {
        Organization org = new Organization();
        org.setId(100L);
        org.setName("Food Bank");
        org.setContactPerson("Alice");
        org.setPhone("123456789");
        org.setAddress("123 Street");
        org.setOrganizationType(OrganizationType.CHARITY);
        org.setCapacity(50);
        org.setBusinessLicense("LICENSE123");
        org.setVerificationStatus(VerificationStatus.PENDING);
        org.setCreatedAt(LocalDateTime.now());

        OrganizationDTO dto = OrganizationDTO.toDTO(org);

        assertEquals(100L, dto.getId());
        assertEquals("Alice", dto.getContactPerson());
        assertEquals(50, dto.getCapacity());
        assertEquals(VerificationStatus.PENDING, dto.getVerificationStatus());
    }
}