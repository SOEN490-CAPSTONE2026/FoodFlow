package com.example.foodflow.integration;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.SurplusService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify temperature and packaging type compliance logging.
 * Story: As a donor, I want to log storage temperature and packaging type so that compliance can be verified.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TemperaturePackagingComplianceTest {

    @Autowired
    private SurplusService surplusService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private Validator validator;

    private User testDonor;


    @BeforeEach
    void setUp() {
        // Create organization for the donor
        Organization organization = new Organization();
        organization.setName("Test Donor Organization");
        organization.setOrganizationType(OrganizationType.RESTAURANT);
        organization.setContactPerson("Test Contact");
        organization.setAddress("123 Test Street");
        organization.setPhone("555-0100");
        organization = organizationRepository.save(organization);

        // Create and persist donor user
        testDonor = new User();
        testDonor.setEmail("testdonor@compliance.test");
        testDonor.setPassword(passwordEncoder.encode("TestPassword123!"));
        testDonor.setRole(UserRole.DONOR);
        testDonor.setOrganization(organization);
        testDonor = userRepository.save(testDonor);
    }

    /**
     * Test: Donor selects "Frozen" + "Sealed" → donation posts successfully
     */
    @Test
    void testCreateDonationWithFrozenSealed() {
        // Arrange
        CreateSurplusRequest request = createBaseRequest();
        request.setTemperatureCategory(TemperatureCategory.FROZEN);
        request.setPackagingType(PackagingType.SEALED);

        // Act
        SurplusResponse response = surplusService.createSurplusPost(request, testDonor);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(TemperatureCategory.FROZEN, response.getTemperatureCategory());
        assertEquals(PackagingType.SEALED, response.getPackagingType());
    }

    /**
     * Test: Donor selects "Room Temperature" + "Loose" → visible to receivers
     */
    @Test
    void testCreateDonationWithRoomTemperatureLoose() {
        // Arrange
        CreateSurplusRequest request = createBaseRequest();
        request.setTemperatureCategory(TemperatureCategory.ROOM_TEMPERATURE);
        request.setPackagingType(PackagingType.LOOSE);

        // Act
        SurplusResponse response = surplusService.createSurplusPost(request, testDonor);

        // Assert
        assertNotNull(response);
        assertEquals(TemperatureCategory.ROOM_TEMPERATURE, response.getTemperatureCategory());
        assertEquals(PackagingType.LOOSE, response.getPackagingType());

        // Verify data is returned correctly
        assertEquals("Room Temperature", response.getTemperatureCategory().getDisplayName());
        assertEquals("Loose", response.getPackagingType().getDisplayName());
    }

    /**
     * Test: Missing temperature category → validation error
     */
    @Test
    void testMissingTemperatureCategoryThrowsValidationError() {
        // Arrange
        CreateSurplusRequest request = createBaseRequest();
        request.setTemperatureCategory(null);
        request.setPackagingType(PackagingType.BOXED);

        // Act - Manually validate the request using Jakarta Validator
        Set<ConstraintViolation<CreateSurplusRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty(), "Should have validation violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("temperatureCategory")),
                "Should have violation for temperatureCategory");
    }

    /**
     * Test: Missing packaging type → validation error
     */
    @Test
    void testMissingPackagingTypeThrowsValidationError() {
        // Arrange
        CreateSurplusRequest request = createBaseRequest();
        request.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        request.setPackagingType(null);

        // Act - Manually validate the request using Jakarta Validator
        Set<ConstraintViolation<CreateSurplusRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty(), "Should have validation violations");
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("packagingType")),
                "Should have violation for packagingType");
    }

    /**
     * Test: All temperature categories work
     */
    @Test
    void testAllTemperatureCategories() {
        for (TemperatureCategory category : TemperatureCategory.values()) {
            CreateSurplusRequest request = createBaseRequest();
            request.setTemperatureCategory(category);
            request.setPackagingType(PackagingType.SEALED);

            SurplusResponse response = surplusService.createSurplusPost(request, testDonor);

            assertNotNull(response);
            assertEquals(category, response.getTemperatureCategory());
        }
    }

    /**
     * Test: All packaging types work
     */
    @Test
    void testAllPackagingTypes() {
        for (PackagingType type : PackagingType.values()) {
            CreateSurplusRequest request = createBaseRequest();
            request.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
            request.setPackagingType(type);

            SurplusResponse response = surplusService.createSurplusPost(request, testDonor);

            assertNotNull(response);
            assertEquals(type, response.getPackagingType());
        }
    }

    // Helper methods


    private CreateSurplusRequest createBaseRequest() {
        CreateSurplusRequest request = new CreateSurplusRequest();
        request.setTitle("Test Donation");
        request.setDescription("Test description");
        request.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        request.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now().plusDays(1));
        request.setPickupFrom(LocalTime.of(10, 0));
        request.setPickupTo(LocalTime.of(12, 0));

        Location location = new Location();
        location.setAddress("123 Test Street");
        location.setLatitude(45.5017);
        location.setLongitude(-73.5673);
        request.setPickupLocation(location);

        return request;
    }
}

