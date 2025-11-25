package com.example.foodflow.service;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class DonorRegistrationValidationTests {

    @Autowired
    private UserRepository userRepository;

    @Test
    void cannotSaveOrganizationWithoutBusinessLicense() {
        // Arrange
        User user = new User();
        user.setEmail("donor@example.com");
        user.setPassword("password123");
        user.setRole(UserRole.DONOR);

        Organization org = new Organization();
        org.setName("Helping Hands");
        org.setContactPerson("John Doe");
        org.setPhone("1234567890");
        org.setAddress("123 Street");
        org.setOrganizationType(OrganizationType.RESTAURANT);
        org.setBusinessLicense(null); // testing null

        user.setOrganization(org);
        org.setUser(user);

        // Act & Assert
        assertThrows(ConstraintViolationException.class, () -> userRepository.saveAndFlush(user));
    }

    @Test
    void canSaveOrganizationWithBusinessLicense() {
        // Arrange
        User user = new User();
        user.setEmail("donor2@example.com");
        user.setPassword("password123");
        user.setRole(UserRole.DONOR);

        Organization org = new Organization();
        org.setName("Kind Meals");
        org.setContactPerson("Alice Johnson");
        org.setPhone("5555555555");
        org.setAddress("789 Boulevard");
        org.setOrganizationType(OrganizationType.RESTAURANT);
        org.setBusinessLicense("BL987654"); // valid

        user.setOrganization(org);
        org.setUser(user);

        // Act
        User savedUser = userRepository.saveAndFlush(user);

        // Assert
        assertNotNull(savedUser.getId());
        assertNotNull(savedUser.getOrganization());
        assertEquals("BL987654", savedUser.getOrganization().getBusinessLicense());
    }
}
