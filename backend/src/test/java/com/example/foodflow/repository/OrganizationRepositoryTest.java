package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.VerificationStatus;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class OrganizationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    void findByUserId_ExistingUser_ReturnsOrganization() {
        // Given
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword("password");
        user.setRole(UserRole.DONOR);
        User savedUser = entityManager.persistAndFlush(user);

        Organization org = new Organization();
        org.setName("Test Restaurant");
        org.setOrganizationType(OrganizationType.RESTAURANT);
        org.setContactPerson("John Doe");
        org.setPhone("123-456-7890");
        org.setAddress("123 Main St");
        org.setVerificationStatus(VerificationStatus.PENDING);
        org.setUser(savedUser);
        entityManager.persistAndFlush(org);

        // When
        Optional<Organization> found = organizationRepository.findByUserId(savedUser.getId());

        // Then
        assertTrue(found.isPresent());
        assertEquals("Test Restaurant", found.get().getName());
        assertEquals(OrganizationType.RESTAURANT, found.get().getOrganizationType());
        assertEquals(savedUser.getId(), found.get().getUser().getId());
    }

    @Test
    void findByUserId_NonExistingUser_ReturnsEmpty() {
        // When
        Optional<Organization> found = organizationRepository.findByUserId(999L);

        // Then
        assertFalse(found.isPresent());
    }

    @Test
    void save_NewOrganization_Success() {
        // Given
        User user = new User();
        user.setEmail("new@example.com");
        user.setPassword("password");
        user.setRole(UserRole.DONOR);
        User savedUser = entityManager.persistAndFlush(user);

        Organization org = new Organization();
        org.setName("New Organization");
        org.setOrganizationType(OrganizationType.GROCERY_STORE);
        org.setContactPerson("Contact Person");
        org.setPhone("123-456-7890");
        org.setAddress("123 Address St");
        org.setVerificationStatus(VerificationStatus.PENDING);
        org.setUser(savedUser);

        // When
        Organization saved = organizationRepository.save(org);

        // Then
        assertNotNull(saved.getId());
        assertEquals("New Organization", saved.getName());
        assertEquals(OrganizationType.GROCERY_STORE, saved.getOrganizationType());
        assertEquals(VerificationStatus.PENDING, saved.getVerificationStatus());
        assertEquals(savedUser.getId(), saved.getUser().getId());
    }

    @Test
    void save_UpdateExistingOrganization_Success() {
        // Given
        User user = new User();
        user.setEmail("update@example.com");
        user.setPassword("password");
        user.setRole(UserRole.DONOR);
        User savedUser = entityManager.persistAndFlush(user);

        Organization org = new Organization();
        org.setName("Original Name");
        org.setOrganizationType(OrganizationType.RESTAURANT);
        org.setContactPerson("Original Contact");
        org.setPhone("123-456-7890");
        org.setAddress("123 Address St");
        org.setVerificationStatus(VerificationStatus.PENDING);
        org.setUser(savedUser);
        Organization savedOrg = entityManager.persistAndFlush(org);

        // When
        savedOrg.setName("Updated Name");
        savedOrg.setVerificationStatus(VerificationStatus.VERIFIED);
        Organization updated = organizationRepository.save(savedOrg);

        // Then
        assertEquals("Updated Name", updated.getName());
        assertEquals(VerificationStatus.VERIFIED, updated.getVerificationStatus());
        assertEquals(savedOrg.getId(), updated.getId());
    }
}
