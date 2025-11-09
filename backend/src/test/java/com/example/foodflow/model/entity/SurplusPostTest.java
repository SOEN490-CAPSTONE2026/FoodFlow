package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SurplusPostTest {

    @Test
    void testDefaultConstructor() {
        SurplusPost post = new SurplusPost();
        
        assertNotNull(post);
        assertNull(post.getId());
        assertNull(post.getTitle());
        assertNotNull(post.getFoodCategories());
        assertTrue(post.getFoodCategories().isEmpty());
        assertEquals(PostStatus.AVAILABLE, post.getStatus());
    }

    @Test
    void testSettersAndGetters() {
        SurplusPost post = new SurplusPost();
        Long id = 1L;
        String title = "Test Food";
        String description = "Test description";
        LocalDate expiryDate = LocalDate.of(2024, 12, 31);
        LocalDate pickupDate = LocalDate.of(2024, 6, 15);
        LocalTime pickupFrom = LocalTime.of(10, 0);
        LocalTime pickupTo = LocalTime.of(12, 0);
        String otpCode = "123456";
        User donor = new User();
        Quantity quantity = new Quantity();
        Location location = new Location();
        
        post.setId(id);
        post.setTitle(title);
        post.setDescription(description);
        post.setExpiryDate(expiryDate);
        post.setPickupDate(pickupDate);
        post.setPickupFrom(pickupFrom);
        post.setPickupTo(pickupTo);
        post.setOtpCode(otpCode);
        post.setDonor(donor);
        post.setQuantity(quantity);
        post.setPickupLocation(location);
        
        assertEquals(id, post.getId());
        assertEquals(title, post.getTitle());
        assertEquals(description, post.getDescription());
        assertEquals(expiryDate, post.getExpiryDate());
        assertEquals(pickupDate, post.getPickupDate());
        assertEquals(pickupFrom, post.getPickupFrom());
        assertEquals(pickupTo, post.getPickupTo());
        assertEquals(otpCode, post.getOtpCode());
        assertEquals(donor, post.getDonor());
        assertEquals(quantity, post.getQuantity());
        assertEquals(location, post.getPickupLocation());
    }

    @Test
    void testDefaultStatus() {
        SurplusPost post = new SurplusPost();
        
        assertEquals(PostStatus.AVAILABLE, post.getStatus());
    }

    @Test
    void testStatusCanBeChanged() {
        SurplusPost post = new SurplusPost();
        
        post.setStatus(PostStatus.AVAILABLE);
        assertEquals(PostStatus.AVAILABLE, post.getStatus());
        
        post.setStatus(PostStatus.CLAIMED);
        assertEquals(PostStatus.CLAIMED, post.getStatus());
        
        post.setStatus(PostStatus.COMPLETED);
        assertEquals(PostStatus.COMPLETED, post.getStatus());
        
        post.setStatus(PostStatus.EXPIRED);
        assertEquals(PostStatus.EXPIRED, post.getStatus());
    }

    @Test
    void testFoodCategories() {
        SurplusPost post = new SurplusPost();
        Set<FoodCategory> categories = new HashSet<>();
        categories.add(FoodCategory.FRUITS_VEGETABLES);
        categories.add(FoodCategory.DAIRY);
        
        post.setFoodCategories(categories);
        
        assertEquals(2, post.getFoodCategories().size());
        assertTrue(post.getFoodCategories().contains(FoodCategory.FRUITS_VEGETABLES));
        assertTrue(post.getFoodCategories().contains(FoodCategory.DAIRY));
    }

    @Test
    void testPickupSlots() {
        SurplusPost post = new SurplusPost();
        List<PickupSlot> slots = new ArrayList<>();
        PickupSlot slot1 = new PickupSlot();
        slot1.setSlotOrder(1);
        PickupSlot slot2 = new PickupSlot();
        slot2.setSlotOrder(2);
        slots.add(slot1);
        slots.add(slot2);
        
        post.setPickupSlots(slots);
        
        assertEquals(2, post.getPickupSlots().size());
        assertEquals(slot1, post.getPickupSlots().get(0));
        assertEquals(slot2, post.getPickupSlots().get(1));
    }

    @Test
    void testDonorRelationship() {
        SurplusPost post = new SurplusPost();
        User donor = new User();
        donor.setId(123L);
        donor.setEmail("donor@test.com");
        
        post.setDonor(donor);
        
        assertNotNull(post.getDonor());
        assertEquals(123L, post.getDonor().getId());
        assertEquals("donor@test.com", post.getDonor().getEmail());
    }

    @Test
    void testQuantity() {
        SurplusPost post = new SurplusPost();
        Quantity quantity = new Quantity();
        
        post.setQuantity(quantity);
        
        assertNotNull(post.getQuantity());
        assertEquals(quantity, post.getQuantity());
    }

    @Test
    void testLocation() {
        SurplusPost post = new SurplusPost();
        Location location = new Location();
        
        post.setPickupLocation(location);
        
        assertNotNull(post.getPickupLocation());
        assertEquals(location, post.getPickupLocation());
    }

    @Test
    void testIsClaimed_ReturnsTrueWhenStatusIsClaimed() {
        SurplusPost post = new SurplusPost();
        post.setStatus(PostStatus.CLAIMED);
        
        assertTrue(post.isClaimed());
    }

    @Test
    void testIsClaimed_ReturnsFalseWhenStatusIsAvailable() {
        SurplusPost post = new SurplusPost();
        post.setStatus(PostStatus.AVAILABLE);
        
        assertFalse(post.isClaimed());
    }

    @Test
    void testIsClaimed_ReturnsFalseWhenStatusIsCompleted() {
        SurplusPost post = new SurplusPost();
        post.setStatus(PostStatus.COMPLETED);
        
        assertFalse(post.isClaimed());
    }

    @Test
    void testIsClaimed_ReturnsFalseWhenStatusIsExpired() {
        SurplusPost post = new SurplusPost();
        post.setStatus(PostStatus.EXPIRED);
        
        assertFalse(post.isClaimed());
    }

    @Test
    void testOtpCode() {
        SurplusPost post = new SurplusPost();
        String otp = "654321";
        
        post.setOtpCode(otp);
        
        assertEquals(otp, post.getOtpCode());
    }

    @Test
    void testOtpCodeCanBeNull() {
        SurplusPost post = new SurplusPost();
        post.setOtpCode(null);
        
        assertNull(post.getOtpCode());
    }

    @Test
    void testTimestamps() {
        SurplusPost post = new SurplusPost();
        
        assertNull(post.getCreatedAt());
        assertNull(post.getUpdatedAt());
    }

    @Test
    void testTitle() {
        SurplusPost post = new SurplusPost();
        String title = "Fresh Vegetables";
        
        post.setTitle(title);
        
        assertEquals(title, post.getTitle());
    }

    @Test
    void testDescription() {
        SurplusPost post = new SurplusPost();
        String description = "Fresh organic vegetables, slightly bruised but still good";
        
        post.setDescription(description);
        
        assertEquals(description, post.getDescription());
    }

    @Test
    void testPickupTimeFrame() {
        SurplusPost post = new SurplusPost();
        LocalDate date = LocalDate.of(2024, 6, 20);
        LocalTime from = LocalTime.of(9, 0);
        LocalTime to = LocalTime.of(17, 0);
        
        post.setPickupDate(date);
        post.setPickupFrom(from);
        post.setPickupTo(to);
        
        assertEquals(date, post.getPickupDate());
        assertEquals(from, post.getPickupFrom());
        assertEquals(to, post.getPickupTo());
    }

    @Test
    void testExpiryDate() {
        SurplusPost post = new SurplusPost();
        LocalDate expiry = LocalDate.of(2024, 6, 25);
        
        post.setExpiryDate(expiry);
        
        assertEquals(expiry, post.getExpiryDate());
    }

    @Test
    void testEmptyPickupSlots() {
        SurplusPost post = new SurplusPost();
        
        assertNotNull(post.getPickupSlots());
        assertTrue(post.getPickupSlots().isEmpty());
    }

    @Test
    void testEmptyFoodCategories() {
        SurplusPost post = new SurplusPost();
        
        assertNotNull(post.getFoodCategories());
        assertTrue(post.getFoodCategories().isEmpty());
    }
}
