package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class AuditLogTest {

    @Test
    void testNoArgsConstructor() {
        AuditLog log = new AuditLog();
        
        assertNotNull(log);
        assertNull(log.getId());
        assertNull(log.getUsername());
        assertNull(log.getAction());
        assertNull(log.getEntityType());
        assertNull(log.getEntityId());
        assertNull(log.getIpAddress());
        assertNotNull(log.getTimestamp());
        assertNull(log.getOldValue());
        assertNull(log.getNewValue());
    }

    @Test
    void testAllArgsConstructor() {
        Long id = 1L;
        String username = "testuser";
        String action = "CREATE";
        String entityType = "User";
        String entityId = "123";
        String ipAddress = "192.168.1.1";
        LocalDateTime timestamp = LocalDateTime.now();
        String oldValue = "old";
        String newValue = "new";
        
        AuditLog log = new AuditLog(id, username, action, entityType, entityId, ipAddress, timestamp, oldValue, newValue);
        
        assertEquals(id, log.getId());
        assertEquals(username, log.getUsername());
        assertEquals(action, log.getAction());
        assertEquals(entityType, log.getEntityType());
        assertEquals(entityId, log.getEntityId());
        assertEquals(ipAddress, log.getIpAddress());
        assertEquals(timestamp, log.getTimestamp());
        assertEquals(oldValue, log.getOldValue());
        assertEquals(newValue, log.getNewValue());
    }

    @Test
    void testParameterizedConstructor() {
        String username = "admin";
        String action = "UPDATE";
        String entityType = "Organization";
        String entityId = "456";
        String ipAddress = "10.0.0.1";
        String oldValue = "{\"name\":\"Old Name\"}";
        String newValue = "{\"name\":\"New Name\"}";
        
        AuditLog log = new AuditLog(username, action, entityType, entityId, ipAddress, oldValue, newValue);
        
        assertEquals(username, log.getUsername());
        assertEquals(action, log.getAction());
        assertEquals(entityType, log.getEntityType());
        assertEquals(entityId, log.getEntityId());
        assertEquals(ipAddress, log.getIpAddress());
        assertEquals(oldValue, log.getOldValue());
        assertEquals(newValue, log.getNewValue());
        assertNotNull(log.getTimestamp());
    }

    @Test
    void testSettersAndGetters() {
        AuditLog log = new AuditLog();
        Long id = 10L;
        String username = "user123";
        String action = "DELETE";
        String entityType = "SurplusPost";
        String entityId = "789";
        String ipAddress = "172.16.0.1";
        LocalDateTime timestamp = LocalDateTime.of(2024, 6, 15, 10, 30);
        String oldValue = "{\"status\":\"active\"}";
        String newValue = "{\"status\":\"deleted\"}";
        
        log.setId(id);
        log.setUsername(username);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setIpAddress(ipAddress);
        log.setTimestamp(timestamp);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        
        assertEquals(id, log.getId());
        assertEquals(username, log.getUsername());
        assertEquals(action, log.getAction());
        assertEquals(entityType, log.getEntityType());
        assertEquals(entityId, log.getEntityId());
        assertEquals(ipAddress, log.getIpAddress());
        assertEquals(timestamp, log.getTimestamp());
        assertEquals(oldValue, log.getOldValue());
        assertEquals(newValue, log.getNewValue());
    }

    @Test
    void testTimestampInitialization() {
        LocalDateTime before = LocalDateTime.now();
        AuditLog log = new AuditLog();
        LocalDateTime after = LocalDateTime.now();
        
        assertNotNull(log.getTimestamp());
        assertTrue(log.getTimestamp().isAfter(before.minusSeconds(1)));
        assertTrue(log.getTimestamp().isBefore(after.plusSeconds(1)));
    }

    @Test
    void testEquals_SameObject() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        
        assertEquals(log, log);
    }

    @Test
    void testEquals_EqualObjects() {
        // Use the same timestamp for both objects to avoid microsecond differences
        LocalDateTime fixedTimestamp = LocalDateTime.of(2024, 6, 15, 10, 30, 0);
        
        AuditLog log1 = new AuditLog();
        log1.setId(1L);
        log1.setUsername("user");
        log1.setAction("CREATE");
        log1.setTimestamp(fixedTimestamp); // Set same timestamp
        
        AuditLog log2 = new AuditLog();
        log2.setId(1L);
        log2.setUsername("user");
        log2.setAction("CREATE");
        log2.setTimestamp(fixedTimestamp); // Set same timestamp
        
        assertEquals(log1, log2);
    }

    @Test
    void testEquals_DifferentObjects() {
        AuditLog log1 = new AuditLog();
        log1.setId(1L);
        log1.setUsername("user1");
        
        AuditLog log2 = new AuditLog();
        log2.setId(2L);
        log2.setUsername("user2");
        
        assertNotEquals(log1, log2);
    }

    @Test
    void testHashCode() {
        // Use the same timestamp for consistent hashCode
        LocalDateTime fixedTimestamp = LocalDateTime.of(2024, 6, 15, 10, 30, 0);
        
        AuditLog log1 = new AuditLog();
        log1.setId(1L);
        log1.setUsername("user");
        log1.setTimestamp(fixedTimestamp);
        
        AuditLog log2 = new AuditLog();
        log2.setId(1L);
        log2.setUsername("user");
        log2.setTimestamp(fixedTimestamp);
        
        assertEquals(log1.hashCode(), log2.hashCode());
    }

    @Test
    void testToString() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setUsername("testuser");
        log.setAction("CREATE");
        
        String result = log.toString();
        
        assertNotNull(result);
        assertTrue(result.contains("AuditLog"));
        assertTrue(result.contains("testuser"));
        assertTrue(result.contains("CREATE"));
    }

    @Test
    void testNullValues() {
        AuditLog log = new AuditLog(null, null, null, null, null, null, null);
        
        assertNull(log.getUsername());
        assertNull(log.getAction());
        assertNull(log.getEntityType());
        assertNull(log.getEntityId());
        assertNull(log.getIpAddress());
        assertNull(log.getOldValue());
        assertNull(log.getNewValue());
        assertNotNull(log.getTimestamp());
    }

    @Test
    void testActionTypes() {
        AuditLog createLog = new AuditLog();
        createLog.setAction("CREATE");
        assertEquals("CREATE", createLog.getAction());
        
        AuditLog updateLog = new AuditLog();
        updateLog.setAction("UPDATE");
        assertEquals("UPDATE", updateLog.getAction());
        
        AuditLog deleteLog = new AuditLog();
        deleteLog.setAction("DELETE");
        assertEquals("DELETE", deleteLog.getAction());
    }

    @Test
    void testEntityTypes() {
        AuditLog log = new AuditLog();
        
        log.setEntityType("User");
        assertEquals("User", log.getEntityType());
        
        log.setEntityType("Organization");
        assertEquals("Organization", log.getEntityType());
        
        log.setEntityType("SurplusPost");
        assertEquals("SurplusPost", log.getEntityType());
    }

    @Test
    void testIpAddressFormats() {
        AuditLog log = new AuditLog();
        
        log.setIpAddress("192.168.1.1");
        assertEquals("192.168.1.1", log.getIpAddress());
        
        log.setIpAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        assertEquals("2001:0db8:85a3:0000:0000:8a2e:0370:7334", log.getIpAddress());
    }

    @Test
    void testLongTextValues() {
        AuditLog log = new AuditLog();
        String longOldValue = "A".repeat(5000);
        String longNewValue = "B".repeat(5000);
        
        log.setOldValue(longOldValue);
        log.setNewValue(longNewValue);
        
        assertEquals(longOldValue, log.getOldValue());
        assertEquals(longNewValue, log.getNewValue());
    }
}