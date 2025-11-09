package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.ClaimStatus;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class ClaimTest {

    @Test
    void testDefaultConstructor() {
        Claim claim = new Claim();
        
        assertNotNull(claim);
        assertNull(claim.getId());
        assertNull(claim.getSurplusPost());
        assertNull(claim.getReceiver());
        assertNull(claim.getClaimedAt());
        assertEquals(ClaimStatus.ACTIVE, claim.getStatus());
    }

    @Test
    void testParameterizedConstructor() {
        SurplusPost post = new SurplusPost();
        User receiver = new User();
        
        Claim claim = new Claim(post, receiver);
        
        assertNotNull(claim);
        assertEquals(post, claim.getSurplusPost());
        assertEquals(receiver, claim.getReceiver());
        assertEquals(ClaimStatus.ACTIVE, claim.getStatus());
    }

    @Test
    void testSettersAndGetters() {
        Claim claim = new Claim();
        Long id = 1L;
        SurplusPost post = new SurplusPost();
        User receiver = new User();
        LocalDate pickupDate = LocalDate.of(2024, 6, 15);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        claim.setId(id);
        claim.setSurplusPost(post);
        claim.setReceiver(receiver);
        claim.setStatus(ClaimStatus.COMPLETED);
        claim.setConfirmedPickupDate(pickupDate);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);
        
        assertEquals(id, claim.getId());
        assertEquals(post, claim.getSurplusPost());
        assertEquals(receiver, claim.getReceiver());
        assertEquals(ClaimStatus.COMPLETED, claim.getStatus());
        assertEquals(pickupDate, claim.getConfirmedPickupDate());
        assertEquals(startTime, claim.getConfirmedPickupStartTime());
        assertEquals(endTime, claim.getConfirmedPickupEndTime());
    }

    @Test
    void testDefaultStatus() {
        Claim claim = new Claim();
        
        assertEquals(ClaimStatus.ACTIVE, claim.getStatus());
    }

    @Test
    void testStatusCanBeChanged() {
        Claim claim = new Claim();
        
        claim.setStatus(ClaimStatus.ACTIVE);
        assertEquals(ClaimStatus.ACTIVE, claim.getStatus());
        
        claim.setStatus(ClaimStatus.COMPLETED);
        assertEquals(ClaimStatus.COMPLETED, claim.getStatus());
        
        claim.setStatus(ClaimStatus.CANCELLED);
        assertEquals(ClaimStatus.CANCELLED, claim.getStatus());
    }

    @Test
    void testSurplusPostRelationship() {
        Claim claim = new Claim();
        SurplusPost post = new SurplusPost();
        post.setId(123L);
        post.setTitle("Test Food");
        
        claim.setSurplusPost(post);
        
        assertNotNull(claim.getSurplusPost());
        assertEquals(123L, claim.getSurplusPost().getId());
        assertEquals("Test Food", claim.getSurplusPost().getTitle());
    }

    @Test
    void testReceiverRelationship() {
        Claim claim = new Claim();
        User receiver = new User();
        receiver.setId(456L);
        receiver.setEmail("receiver@test.com");
        
        claim.setReceiver(receiver);
        
        assertNotNull(claim.getReceiver());
        assertEquals(456L, claim.getReceiver().getId());
        assertEquals("receiver@test.com", claim.getReceiver().getEmail());
    }

    @Test
    void testPickupTime_InitiallyNull() {
        Claim claim = new Claim();
        
        assertNull(claim.getConfirmedPickupDate());
        assertNull(claim.getConfirmedPickupStartTime());
        assertNull(claim.getConfirmedPickupEndTime());
    }

    @Test
    void testPickupTime_CanBeSet() {
        Claim claim = new Claim();
        LocalDate date = LocalDate.of(2024, 7, 20);
        LocalTime start = LocalTime.of(14, 0);
        LocalTime end = LocalTime.of(16, 0);
        
        claim.setConfirmedPickupDate(date);
        claim.setConfirmedPickupStartTime(start);
        claim.setConfirmedPickupEndTime(end);
        
        assertEquals(date, claim.getConfirmedPickupDate());
        assertEquals(start, claim.getConfirmedPickupStartTime());
        assertEquals(end, claim.getConfirmedPickupEndTime());
    }

    @Test
    void testParameterizedConstructor_InitializesCorrectly() {
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        User receiver = new User();
        receiver.setId(2L);
        
        Claim claim = new Claim(post, receiver);
        
        assertEquals(post, claim.getSurplusPost());
        assertEquals(receiver, claim.getReceiver());
        assertEquals(ClaimStatus.ACTIVE, claim.getStatus());
    }
}
