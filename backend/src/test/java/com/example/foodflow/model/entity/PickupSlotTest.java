package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class PickupSlotTest {

    @Test
    void testDefaultConstructor() {
        PickupSlot slot = new PickupSlot();
        
        assertNotNull(slot);
        assertNull(slot.getId());
        assertNull(slot.getSurplusPost());
        assertNull(slot.getPickupDate());
        assertNull(slot.getStartTime());
        assertNull(slot.getEndTime());
        assertNull(slot.getNotes());
        assertNull(slot.getSlotOrder());
    }

    @Test
    void testParameterizedConstructor() {
        SurplusPost post = new SurplusPost();
        LocalDate date = LocalDate.of(2024, 6, 15);
        LocalTime start = LocalTime.of(10, 0);
        LocalTime end = LocalTime.of(12, 0);
        String notes = "Test notes";
        Integer order = 1;
        
        PickupSlot slot = new PickupSlot(post, date, start, end, notes, order);
        
        assertNotNull(slot);
        assertEquals(post, slot.getSurplusPost());
        assertEquals(date, slot.getPickupDate());
        assertEquals(start, slot.getStartTime());
        assertEquals(end, slot.getEndTime());
        assertEquals(notes, slot.getNotes());
        assertEquals(order, slot.getSlotOrder());
    }

    @Test
    void testSettersAndGetters() {
        PickupSlot slot = new PickupSlot();
        Long id = 1L;
        SurplusPost post = new SurplusPost();
        LocalDate date = LocalDate.of(2024, 7, 20);
        LocalTime start = LocalTime.of(14, 0);
        LocalTime end = LocalTime.of(16, 0);
        String notes = "Pickup notes";
        Integer order = 2;
        
        slot.setId(id);
        slot.setSurplusPost(post);
        slot.setPickupDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setNotes(notes);
        slot.setSlotOrder(order);
        
        assertEquals(id, slot.getId());
        assertEquals(post, slot.getSurplusPost());
        assertEquals(date, slot.getPickupDate());
        assertEquals(start, slot.getStartTime());
        assertEquals(end, slot.getEndTime());
        assertEquals(notes, slot.getNotes());
        assertEquals(order, slot.getSlotOrder());
    }

    @Test
    void testSurplusPostRelationship() {
        PickupSlot slot = new PickupSlot();
        SurplusPost post = new SurplusPost();
        post.setId(100L);
        post.setTitle("Test Food");
        
        slot.setSurplusPost(post);
        
        assertNotNull(slot.getSurplusPost());
        assertEquals(100L, slot.getSurplusPost().getId());
    }

    @Test
    void testNotesCanBeNull() {
        PickupSlot slot = new PickupSlot();
        slot.setNotes(null);
        
        assertNull(slot.getNotes());
    }

    @Test
    void testNotesCanBeEmpty() {
        PickupSlot slot = new PickupSlot();
        slot.setNotes("");
        
        assertEquals("", slot.getNotes());
    }

    @Test
    void testSlotOrder() {
        PickupSlot slot1 = new PickupSlot();
        slot1.setSlotOrder(1);
        
        PickupSlot slot2 = new PickupSlot();
        slot2.setSlotOrder(2);
        
        assertEquals(1, slot1.getSlotOrder());
        assertEquals(2, slot2.getSlotOrder());
        assertNotEquals(slot1.getSlotOrder(), slot2.getSlotOrder());
    }

    @Test
    void testEquals_SameObject() {
        PickupSlot slot = new PickupSlot();
        
        assertEquals(slot, slot);
    }

    @Test
    void testEquals_NullObject() {
        PickupSlot slot = new PickupSlot();
        
        assertNotEquals(null, slot);
    }

    @Test
    void testEquals_DifferentClass() {
        PickupSlot slot = new PickupSlot();
        String other = "not a pickup slot";
        
        assertNotEquals(slot, other);
    }

    @Test
    void testEquals_SameId() {
        PickupSlot slot1 = new PickupSlot();
        slot1.setId(1L);
        
        PickupSlot slot2 = new PickupSlot();
        slot2.setId(1L);
        
        assertEquals(slot1, slot2);
    }

    @Test
    void testEquals_DifferentId() {
        PickupSlot slot1 = new PickupSlot();
        slot1.setId(1L);
        
        PickupSlot slot2 = new PickupSlot();
        slot2.setId(2L);
        
        assertNotEquals(slot1, slot2);
    }

    @Test
    void testEquals_BothIdsNull() {
        PickupSlot slot1 = new PickupSlot();
        PickupSlot slot2 = new PickupSlot();
        
        assertEquals(slot1, slot2);
    }

    @Test
    void testHashCode_SameId() {
        PickupSlot slot1 = new PickupSlot();
        slot1.setId(1L);
        
        PickupSlot slot2 = new PickupSlot();
        slot2.setId(1L);
        
        assertEquals(slot1.hashCode(), slot2.hashCode());
    }

    @Test
    void testHashCode_DifferentId() {
        PickupSlot slot1 = new PickupSlot();
        slot1.setId(1L);
        
        PickupSlot slot2 = new PickupSlot();
        slot2.setId(2L);
        
        assertNotEquals(slot1.hashCode(), slot2.hashCode());
    }

    @Test
    void testToString() {
        PickupSlot slot = new PickupSlot();
        slot.setId(1L);
        slot.setPickupDate(LocalDate.of(2024, 6, 15));
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slot.setSlotOrder(1);
        
        String result = slot.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("PickupSlot"));
        assertTrue(result.contains("id=1"));
        assertTrue(result.contains("pickupDate=2024-06-15"));
        assertTrue(result.contains("slotOrder=1"));
    }

    @Test
    void testToString_NullValues() {
        PickupSlot slot = new PickupSlot();
        
        String result = slot.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("PickupSlot"));
    }

    @Test
    void testParameterizedConstructor_WithNullNotes() {
        SurplusPost post = new SurplusPost();
        LocalDate date = LocalDate.of(2024, 6, 15);
        LocalTime start = LocalTime.of(10, 0);
        LocalTime end = LocalTime.of(12, 0);
        
        PickupSlot slot = new PickupSlot(post, date, start, end, null, 1);
        
        assertNull(slot.getNotes());
    }
}
