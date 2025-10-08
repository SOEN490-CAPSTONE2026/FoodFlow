package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.VerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class SurplusPostRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private User donor;
    private Organization organization;

    @BeforeEach
    void setUp() {
        // Create organization
        organization = new Organization();
        organization.setName("Test Restaurant");
        organization.setOrganizationType(OrganizationType.RESTAURANT);  // ✅ Correct setter
        organization.setContactPerson("John Doe");
        organization.setPhone("123-456-7890");
        organization.setAddress("123 Main St");
        organization.setVerificationStatus(VerificationStatus.PENDING);
        organization = organizationRepository.save(organization);

        // Create donor user
        donor = new User();
        donor.setEmail("donor@test.com");
        donor.setPassword("hashedPassword");
        donor.setRole(UserRole.DONOR);
        donor.setOrganization(organization);
        donor = userRepository.save(donor);
    }

    @Test
    void testSaveSurplusPost() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setFoodName("Vegetable Lasagna");
        post.setFoodType("Prepared Meals");
        post.setQuantity(10.0);
        post.setUnit("kg");
        post.setLocation("123 Main St");
        post.setExpiryDate(LocalDateTime.now().plusDays(2));
        post.setPickupFrom(LocalDateTime.now().plusHours(3));
        post.setPickupTo(LocalTime.of(18, 0));
        post.setNotes("Vegetarian lasagna");

        // When
        SurplusPost saved = surplusPostRepository.save(post);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getFoodName()).isEqualTo("Vegetable Lasagna");
        assertThat(saved.getFoodType()).isEqualTo("Prepared Meals");
        assertThat(saved.getQuantity()).isEqualTo(10.0);
        assertThat(saved.getUnit()).isEqualTo("kg");
        assertThat(saved.getDonor().getEmail()).isEqualTo("donor@test.com");
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    void testFindAll() {
        // Given
        SurplusPost post1 = createSurplusPost("Bread", 5.0);
        SurplusPost post2 = createSurplusPost("Milk", 3.0);
        surplusPostRepository.save(post1);
        surplusPostRepository.save(post2);

        // When
        Iterable<SurplusPost> all = surplusPostRepository.findAll();

        // Then
        assertThat(all).hasSize(2);
    }

    @Test
    void testFindById() {
        // Given
        SurplusPost post = createSurplusPost("Fruit", 20.0);
        SurplusPost saved = surplusPostRepository.save(post);

        // When
        SurplusPost found = surplusPostRepository.findById(saved.getId()).orElse(null);

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getFoodName()).isEqualTo("Fruit");
        assertThat(found.getQuantity()).isEqualTo(20.0);
    }

    private SurplusPost createSurplusPost(String foodName, Double quantity) {
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setFoodName(foodName);
        post.setFoodType("Prepared Meals");
        post.setQuantity(quantity);
        post.setUnit("items");
        post.setLocation("123 Main St");
        post.setExpiryDate(LocalDateTime.now().plusDays(2));
        post.setPickupFrom(LocalDateTime.now().plusHours(3));
        post.setPickupTo(LocalTime.of(18, 0));
        post.setNotes("Test food description");
        return post;
    }

}
