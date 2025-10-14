package com.example.foodflow.dto;
import com.example.foodflow.model.dto.SurplusPostDTO;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import static org.junit.jupiter.api.Assertions.*;

class SurplusPostDTOTest {

    @Test
    void testToDTO() {
        // Create donor
        User donor = new User();
        donor.setId(2L);
        donor.setEmail("donor@example.com");

        SurplusPost post = new SurplusPost();
        post.setId(200L);
        post.setFoodType("Fruit");         
        post.setQuantity(10.0);            
        post.setFoodName("Apples");
        post.setUnit("kg");
        post.setExpiryDate(LocalDate.of(2025, 10, 20));
        post.setPickupFrom(LocalDateTime.of(2025, 10, 15, 9, 0));
        post.setPickupTo(LocalTime.of(17, 0));
        post.setLocation("Warehouse");
        post.setDonor(donor);
        //post.setCreatedAt(post.getCreatedAt());
        //post.setUpdatedAt(LocalDateTime.now());

        SurplusPostDTO dto = SurplusPostDTO.toDTO(post);

        assertNotNull(dto);
        assertEquals(200L, dto.getId());
        assertEquals("Fruit", dto.getType());
        assertEquals("10.0", dto.getQuantity()); // Double -> String
        assertEquals(post.getExpiryDate().atStartOfDay(), dto.getExpiryDate());
        assertEquals(post.getPickupFrom(), dto.getPickupTime());
        assertEquals("Warehouse", dto.getLocation());
        assertNotNull(dto.getDonor());
        assertEquals("donor@example.com", dto.getDonor().getEmail());
        assertEquals(post.getCreatedAt(), dto.getCreatedAt());
        assertEquals(post.getUpdatedAt(), dto.getUpdatedAt());
    }
}
