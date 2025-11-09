package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class MessageTest {

    @Test
    void testDefaultConstructor() {
        Message message = new Message();
        
        assertNotNull(message);
        assertNull(message.getId());
        assertNull(message.getConversation());
        assertNull(message.getSender());
        assertNull(message.getMessageBody());
        assertNull(message.getCreatedAt());
        assertEquals(false, message.getReadStatus());
    }

    @Test
    void testParameterizedConstructor() {
        Conversation conversation = new Conversation();
        User sender = new User();
        String body = "Test message";
        
        Message message = new Message(conversation, sender, body);
        
        assertNotNull(message);
        assertEquals(conversation, message.getConversation());
        assertEquals(sender, message.getSender());
        assertEquals(body, message.getMessageBody());
        assertEquals(false, message.getReadStatus());
    }

    @Test
    void testSettersAndGetters() {
        Message message = new Message();
        Long id = 1L;
        Conversation conversation = new Conversation();
        User sender = new User();
        String body = "Hello World";
        LocalDateTime created = LocalDateTime.now();
        
        message.setId(id);
        message.setConversation(conversation);
        message.setSender(sender);
        message.setMessageBody(body);
        message.setReadStatus(true);
        
        assertEquals(id, message.getId());
        assertEquals(conversation, message.getConversation());
        assertEquals(sender, message.getSender());
        assertEquals(body, message.getMessageBody());
        assertTrue(message.getReadStatus());
    }

    @Test
    void testReadStatus_DefaultsFalse() {
        Message message = new Message();
        
        assertFalse(message.getReadStatus());
    }

    @Test
    void testReadStatus_CanBeSetTrue() {
        Message message = new Message();
        message.setReadStatus(true);
        
        assertTrue(message.getReadStatus());
    }

    @Test
    void testReadStatus_CanBeSetFalse() {
        Message message = new Message();
        message.setReadStatus(false);
        
        assertFalse(message.getReadStatus());
    }

    @Test
    void testMessageBody_CanBeEmpty() {
        Message message = new Message();
        message.setMessageBody("");
        
        assertEquals("", message.getMessageBody());
    }

    @Test
    void testMessageBody_CanBeLong() {
        Message message = new Message();
        String longBody = "A".repeat(1000);
        message.setMessageBody(longBody);
        
        assertEquals(longBody, message.getMessageBody());
    }

    @Test
    void testConversationRelationship() {
        Message message = new Message();
        Conversation conversation = new Conversation();
        conversation.setId(123L);
        
        message.setConversation(conversation);
        
        assertNotNull(message.getConversation());
        assertEquals(123L, message.getConversation().getId());
    }

    @Test
    void testSenderRelationship() {
        Message message = new Message();
        User sender = new User();
        sender.setId(456L);
        sender.setEmail("sender@test.com");
        
        message.setSender(sender);
        
        assertNotNull(message.getSender());
        assertEquals(456L, message.getSender().getId());
        assertEquals("sender@test.com", message.getSender().getEmail());
    }

    @Test
    void testParameterizedConstructor_SetsReadStatusFalse() {
        Conversation conv = new Conversation();
        User user = new User();
        Message message = new Message(conv, user, "Test");
        
        assertFalse(message.getReadStatus());
    }
}
