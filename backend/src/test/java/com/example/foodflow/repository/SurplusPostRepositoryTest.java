package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.VerificationStatus;

import org.jboss.jandex.Main;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;

import java.util.HashSet;
import com.example.foodflow.model.types.*;

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
        post.setTitle("Vegetable Lasagna");

        HashSet<FoodCategory> foodCategories = new HashSet<>();
        foodCategories.add(FoodCategory.PREPARED_MEALS);
        post.setFoodCategories(foodCategories);
        post.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupFrom(LocalDateTime.now().plusHours(3));
        post.setPickupTo(LocalDateTime.now().plusHours(5));
        post.setDescription("Vegetarian lasagna");

        // When
        SurplusPost saved = surplusPostRepository.save(post);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("Vegetable Lasagna");
        assertThat(saved.getFoodCategories().size()).isEqualTo(1);
        assertThat(saved.getFoodCategories().contains(FoodCategory.PREPARED_MEALS)).isEqualTo(true);
        assertThat(saved.getQuantity().getValue()).isEqualTo(10.0);
        assertThat(saved.getQuantity().getUnit()).isEqualTo(Quantity.Unit.KILOGRAM);
        assertThat(saved.getDonor().getEmail()).isEqualTo("donor@test.com");
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    
    @Test
    void testFindAll() {
        // Given
        SurplusPost post1 = createSurplusPost("Bread", new Quantity(5.0,Quantity.Unit.ITEM));
        SurplusPost post2 = createSurplusPost("Milk", new Quantity(3.0,Quantity.Unit.ITEM));
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
        SurplusPost post = createSurplusPost("Fruit", new Quantity(20.0,Quantity.Unit.ITEM));
        SurplusPost saved = surplusPostRepository.save(post);

        // When
        SurplusPost found = surplusPostRepository.findById(saved.getId()).orElse(null);

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getTitle()).isEqualTo("Fruit");
        assertThat(found.getQuantity().getValue()).isEqualTo(20.0);
    }

    private SurplusPost createSurplusPost(String foodName, Quantity quantity) {
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setTitle(foodName);
        post.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        post.setQuantity(quantity);
        post.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupFrom(LocalDateTime.now().plusHours(3));
        post.setPickupTo(LocalDateTime.now().plusHours(5));
        post.setDescription("Test food description");
        return post;
    }

}
