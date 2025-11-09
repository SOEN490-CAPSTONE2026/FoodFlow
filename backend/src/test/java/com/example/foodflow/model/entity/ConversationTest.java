package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ConversationTest {

    @Test
    void testDefaultConstructor() {
        Conversation conversation = new Conversation();
        
        assertNotNull(conversation);
        assertNotNull(conversation.getCreatedAt());
        assertNull(conversation.getId());
        assertNull(conversation.getUser1());
        assertNull(conversation.getUser2());
    }

    @Test
    void testParameterizedConstructor_OrdersUsersByIdCorrectly() {
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        assertNotNull(conversation);
        assertEquals(user1, conversation.getUser1());
        assertEquals(user2, conversation.getUser2());
    }

    @Test
    void testParameterizedConstructor_ReverseOrderSwapsUsers() {
        User user1 = new User();
        user1.setId(5L);
        User user2 = new User();
        user2.setId(3L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        // user2 (id=3) should be user1, user1 (id=5) should be user2
        assertEquals(user2, conversation.getUser1());
        assertEquals(user1, conversation.getUser2());
    }

    @Test
    void testGetOtherParticipant_ReturnsUser2WhenGivenUser1Id() {
        User user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@test.com");
        
        User user2 = new User();
        user2.setId(2L);
        user2.setEmail("user2@test.com");
        
        Conversation conversation = new Conversation(user1, user2);
        
        User other = conversation.getOtherParticipant(1L);
        
        assertEquals(user2, other);
        assertEquals("user2@test.com", other.getEmail());
    }

    @Test
    void testGetOtherParticipant_ReturnsUser1WhenGivenUser2Id() {
        User user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@test.com");
        
        User user2 = new User();
        user2.setId(2L);
        user2.setEmail("user2@test.com");
        
        Conversation conversation = new Conversation(user1, user2);
        
        User other = conversation.getOtherParticipant(2L);
        
        assertEquals(user1, other);
        assertEquals("user1@test.com", other.getEmail());
    }

    @Test
    void testGetOtherParticipant_ThrowsExceptionForNonParticipant() {
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        assertThrows(IllegalArgumentException.class, () -> {
            conversation.getOtherParticipant(999L);
        });
    }

    @Test
    void testIsParticipant_ReturnsTrueForUser1() {
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        assertTrue(conversation.isParticipant(1L));
    }

    @Test
    void testIsParticipant_ReturnsTrueForUser2() {
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        assertTrue(conversation.isParticipant(2L));
    }

    @Test
    void testIsParticipant_ReturnsFalseForNonParticipant() {
        User user1 = new User();
        user1.setId(1L);
        User user2 = new User();
        user2.setId(2L);
        
        Conversation conversation = new Conversation(user1, user2);
        
        assertFalse(conversation.isParticipant(999L));
    }

    @Test
    void testSettersAndGetters() {
        Conversation conversation = new Conversation();
        Long id = 100L;
        User user1 = new User();
        User user2 = new User();
        LocalDateTime created = LocalDateTime.of(2024, 1, 1, 10, 0);
        LocalDateTime lastMessage = LocalDateTime.of(2024, 1, 2, 15, 30);
        
        conversation.setId(id);
        conversation.setUser1(user1);
        conversation.setUser2(user2);
        conversation.setCreatedAt(created);
        conversation.setLastMessageAt(lastMessage);
        
        assertEquals(id, conversation.getId());
        assertEquals(user1, conversation.getUser1());
        assertEquals(user2, conversation.getUser2());
        assertEquals(created, conversation.getCreatedAt());
        assertEquals(lastMessage, conversation.getLastMessageAt());
    }

    @Test
    void testLastMessageAt_InitiallyNull() {
        Conversation conversation = new Conversation();
        
        assertNull(conversation.getLastMessageAt());
    }

    @Test
    void testLastMessageAt_CanBeSet() {
        Conversation conversation = new Conversation();
        LocalDateTime timestamp = LocalDateTime.now();
        
        conversation.setLastMessageAt(timestamp);
        
        assertEquals(timestamp, conversation.getLastMessageAt());
    }
}
