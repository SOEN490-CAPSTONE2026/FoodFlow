package com.example.foodflow.dto;
import com.example.foodflow.model.dto.SurplusPostDTO;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class SurplusPostDTOTest {
/* 
    @Test
    void testToDTO() {
        // Create donor
        User donor = new User();
        donor.setId(2L);
        donor.setEmail("donor@example.com");

        SurplusPost post = new SurplusPost();
        post.setId(200L);
        post.setTitle("Fresh Apples");
        
        // Set food categories (now a Set instead of single type)
        post.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        
        // Set quantity with proper Quantity object
        post.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        
        post.setExpiryDate(LocalDate.of(2025, 10, 20));
        
        // Set pickup date and times separately
        post.setPickupDate(LocalDate.of(2025, 10, 15));
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));
        
        // Set location with proper Location object
        post.setPickupLocation(new Location(45.5017, -73.5673, "Warehouse Address"));
        
        post.setDonor(donor);

        SurplusPostDTO dto = SurplusPostDTO.toDTO(post);

        assertNotNull(dto);
        assertEquals(200L, dto.getId());
        assertEquals("FRUITS_VEGETABLES", dto.getType());
        assertEquals("10.0 kg", dto.getQuantity()); // Quantity toString
        assertEquals(post.getExpiryDate().atStartOfDay(), dto.getExpiryDate());
        assertEquals(post.getPickupDate().atTime(post.getPickupFrom()), dto.getPickupTime());
        assertEquals("Warehouse Address", dto.getLocation());
        assertNotNull(dto.getDonor());
        assertEquals("donor@example.com", dto.getDonor().getEmail());
        assertEquals(post.getCreatedAt(), dto.getCreatedAt());
        assertEquals(post.getUpdatedAt(), dto.getUpdatedAt());
    }
        */
}
