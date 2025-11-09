package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void testDefaultConstructor() {
        User user = new User();
        assertNotNull(user);
        assertNull(user.getId());
        assertNull(user.getEmail());
        assertNull(user.getPassword());
        assertNull(user.getRole());
    }

    @Test
    void testParameterizedConstructor() {
        String email = "test@example.com";
        String password = "password123";
        UserRole role = UserRole.DONOR;

        User user = new User(email, password, role);

        assertNotNull(user);
        assertEquals(email, user.getEmail());
        assertEquals(password, user.getPassword());
        assertEquals(role, user.getRole());
    }

    @Test
    void testSettersAndGetters() {
        User user = new User();
        Long id = 1L;
        String email = "user@test.com";
        String password = "securepass";
        UserRole role = UserRole.RECEIVER;
        Organization org = new Organization();
        LocalDateTime now = LocalDateTime.now();

        user.setId(id);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole(role);
        user.setOrganization(org);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        assertEquals(id, user.getId());
        assertEquals(email, user.getEmail());
        assertEquals(password, user.getPassword());
        assertEquals(role, user.getRole());
        assertEquals(org, user.getOrganization());
        assertEquals(now, user.getCreatedAt());
        assertEquals(now, user.getUpdatedAt());
    }

    @Test
    void testEmailSetter() {
        User user = new User();
        String email = "newemail@example.com";
        
        user.setEmail(email);
        
        assertEquals(email, user.getEmail());
    }

    @Test
    void testPasswordSetter() {
        User user = new User();
        String password = "newpassword123";
        
        user.setPassword(password);
        
        assertEquals(password, user.getPassword());
    }

    @Test
    void testRoleSetter() {
        User user = new User();
        
        user.setRole(UserRole.DONOR);
        assertEquals(UserRole.DONOR, user.getRole());
        
        user.setRole(UserRole.RECEIVER);
        assertEquals(UserRole.RECEIVER, user.getRole());
    }

    @Test
    void testOrganizationRelationship() {
        User user = new User();
        Organization org = new Organization();
        org.setName("Test Org");
        
        user.setOrganization(org);
        
        assertNotNull(user.getOrganization());
        assertEquals("Test Org", user.getOrganization().getName());
    }

    @Test
    void testTimestamps() {
        User user = new User();
        LocalDateTime createdAt = LocalDateTime.of(2024, 1, 1, 10, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2024, 1, 2, 10, 0);
        
        user.setCreatedAt(createdAt);
        user.setUpdatedAt(updatedAt);
        
        assertEquals(createdAt, user.getCreatedAt());
        assertEquals(updatedAt, user.getUpdatedAt());
    }

    @Test
    void testMultipleUsers() {
        User user1 = new User("user1@test.com", "pass1", UserRole.DONOR);
        User user2 = new User("user2@test.com", "pass2", UserRole.RECEIVER);
        
        assertNotEquals(user1.getEmail(), user2.getEmail());
        assertNotEquals(user1.getRole(), user2.getRole());
    }

    @Test
    void testNullOrganization() {
        User user = new User();
        user.setOrganization(null);
        
        assertNull(user.getOrganization());
    }

    @Test
    void testIdAssignment() {
        User user = new User();
        user.setId(100L);
        
        assertEquals(100L, user.getId());
    }
}
