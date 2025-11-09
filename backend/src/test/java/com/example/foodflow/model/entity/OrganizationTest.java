package com.example.foodflow.model.entity;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class OrganizationTest {

    @Test
    void testDefaultConstructor() {
        Organization org = new Organization();
        assertNotNull(org);
        assertNull(org.getId());
        assertNull(org.getName());
        assertNull(org.getUser());
    }

    @Test
    void testSettersAndGetters() {
        Organization org = new Organization();
        Long id = 1L;
        String name = "Test Organization";
        String contactPerson = "John Doe";
        String phone = "123-456-7890";
        String address = "123 Test St";
        OrganizationType type = OrganizationType.RESTAURANT;
        Integer capacity = 100;
        String license = "LIC123";
        VerificationStatus status = VerificationStatus.VERIFIED;
        LocalDateTime now = LocalDateTime.now();
        User user = new User();

        org.setId(id);
        org.setName(name);
        org.setContactPerson(contactPerson);
        org.setPhone(phone);
        org.setAddress(address);
        org.setOrganizationType(type);
        org.setCapacity(capacity);
        org.setBusinessLicense(license);
        org.setVerificationStatus(status);
        org.setCreatedAt(now);
        org.setUser(user);

        assertEquals(id, org.getId());
        assertEquals(name, org.getName());
        assertEquals(contactPerson, org.getContactPerson());
        assertEquals(phone, org.getPhone());
        assertEquals(address, org.getAddress());
        assertEquals(type, org.getOrganizationType());
        assertEquals(capacity, org.getCapacity());
        assertEquals(license, org.getBusinessLicense());
        assertEquals(status, org.getVerificationStatus());
        assertEquals(now, org.getCreatedAt());
        assertEquals(user, org.getUser());
    }

    @Test
    void testDefaultVerificationStatus() {
        Organization org = new Organization();
        org.setVerificationStatus(VerificationStatus.PENDING);
        assertEquals(VerificationStatus.PENDING, org.getVerificationStatus());
    }

    @Test
    void testDonorOrganization() {
        Organization org = new Organization();
        org.setOrganizationType(OrganizationType.RESTAURANT);
        org.setBusinessLicense("BL-12345");
        
        assertEquals(OrganizationType.RESTAURANT, org.getOrganizationType());
        assertEquals("BL-12345", org.getBusinessLicense());
        assertNull(org.getCapacity());
    }

    @Test
    void testReceiverOrganization() {
        Organization org = new Organization();
        org.setOrganizationType(OrganizationType.CHARITY);
        org.setCapacity(50);
        
        assertEquals(OrganizationType.CHARITY, org.getOrganizationType());
        assertEquals(50, org.getCapacity());
        assertNull(org.getBusinessLicense());
    }

    @Test
    void testUserRelationship() {
        Organization org = new Organization();
        User user = new User("test@example.com", "password", UserRole.DONOR);
        user.setId(1L);
        
        org.setUser(user);
        
        assertNotNull(org.getUser());
        assertEquals(1L, org.getUser().getId());
        assertEquals("test@example.com", org.getUser().getEmail());
    }

    @Test
    void testVerificationStatuses() {
        Organization org = new Organization();
        
        org.setVerificationStatus(VerificationStatus.PENDING);
        assertEquals(VerificationStatus.PENDING, org.getVerificationStatus());
        
        org.setVerificationStatus(VerificationStatus.VERIFIED);
        assertEquals(VerificationStatus.VERIFIED, org.getVerificationStatus());
        
        org.setVerificationStatus(VerificationStatus.REJECTED);
        assertEquals(VerificationStatus.REJECTED, org.getVerificationStatus());
    }

    @Test
    void testContactInformation() {
        Organization org = new Organization();
        String contact = "Jane Smith";
        String phone = "555-1234";
        String address = "456 Main St, City, State";
        
        org.setContactPerson(contact);
        org.setPhone(phone);
        org.setAddress(address);
        
        assertEquals(contact, org.getContactPerson());
        assertEquals(phone, org.getPhone());
        assertEquals(address, org.getAddress());
    }

    @Test
    void testNullCapacity() {
        Organization org = new Organization();
        org.setCapacity(null);
        
        assertNull(org.getCapacity());
    }

    @Test
    void testNullBusinessLicense() {
        Organization org = new Organization();
        org.setBusinessLicense(null);
        
        assertNull(org.getBusinessLicense());
    }

    @Test
    void testCreatedAtTimestamp() {
        Organization org = new Organization();
        LocalDateTime timestamp = LocalDateTime.of(2024, 6, 15, 10, 30);
        
        org.setCreatedAt(timestamp);
        
        assertEquals(timestamp, org.getCreatedAt());
    }

    @Test
    void testOrganizationTypes() {
        Organization org = new Organization();
        
        org.setOrganizationType(OrganizationType.RESTAURANT);
        assertEquals(OrganizationType.RESTAURANT, org.getOrganizationType());
        
        org.setOrganizationType(OrganizationType.CHARITY);
        assertEquals(OrganizationType.CHARITY, org.getOrganizationType());
    }
}
