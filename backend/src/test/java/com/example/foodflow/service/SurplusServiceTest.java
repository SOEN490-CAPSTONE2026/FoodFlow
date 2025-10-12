package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SurplusServiceTest { 

    @Mock
    private SurplusPostRepository surplusPostRepository;

    @InjectMocks
    private SurplusService surplusService;

    private User donor;
    private CreateSurplusRequest request;

    @BeforeEach
    void setUp() {
        // Create test organization
        Organization organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Restaurant");
        organization.setOrganizationType(OrganizationType.RESTAURANT);

        // Create test donor
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);
        donor.setOrganization(organization);

        // Create test request with NEW structure
        request = new CreateSurplusRequest();
        request.setTitle("Vegetable Lasagna");
        request.getFoodCategories().add(FoodCategory.PREPARED_MEALS);
        request.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupFrom(LocalDateTime.now().plusHours(3));
        request.setPickupTo(LocalDateTime.now().plusHours(5));
        request.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        request.setDescription("Vegetarian lasagna");
    }

    @Test
    void testCreateSurplusPost_Success() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setTitle(request.getTitle());
        savedPost.setFoodCategories(request.getFoodCategories());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setPickupLocation(request.getPickupLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setDescription(request.getDescription());

        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Vegetable Lasagna");
        assertThat(response.getFoodCategories()).isEqualTo(Set.of(FoodCategory.PREPARED_MEALS));
        assertThat(response.getQuantity()).isEqualTo(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        assertThat(response.getPickupLocation()).isEqualTo(new Location(45.2903, -34.0987, "123 Main St"));
        assertThat(response.getDonorEmail()).isEqualTo("donor@test.com");

        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    
    @Test
    void testCreateSurplusPost_SetsCorrectDonor() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setTitle(request.getTitle());
        mockSavedPost.setFoodCategories(request.getFoodCategories());
        mockSavedPost.setQuantity(request.getQuantity());
        mockSavedPost.setPickupLocation(request.getPickupLocation());
        mockSavedPost.setExpiryDate(request.getExpiryDate());
        mockSavedPost.setPickupFrom(request.getPickupFrom());
        mockSavedPost.setPickupTo(request.getPickupTo());
        mockSavedPost.setDescription(request.getDescription());

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        assertThat(capturedPost.getDonor()).isEqualTo(donor);
        assertThat(capturedPost.getTitle()).isEqualTo("Vegetable Lasagna");
        assertThat(capturedPost.getFoodCategories()).isEqualTo(Set.of(FoodCategory.PREPARED_MEALS));
        assertThat(capturedPost.getQuantity()).isEqualTo(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        assertThat(capturedPost.getPickupLocation()).isEqualTo(new Location(45.2903, -34.0987, "123 Main St"));
        assertThat(capturedPost.getDescription()).isEqualTo("Vegetarian lasagna");
    }


    @Test
    void testCreateSurplusPost_MapsAllFields() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setTitle(request.getTitle());
        mockSavedPost.setFoodCategories(request.getFoodCategories());
        mockSavedPost.setQuantity(request.getQuantity());
        mockSavedPost.setPickupLocation(request.getPickupLocation());
        mockSavedPost.setExpiryDate(request.getExpiryDate());
        mockSavedPost.setPickupFrom(request.getPickupFrom());
        mockSavedPost.setPickupTo(request.getPickupTo());
        mockSavedPost.setDescription(request.getDescription());

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();

        assertThat(capturedPost.getTitle()).isEqualTo(request.getTitle());
        assertThat(capturedPost.getFoodCategories()).isEqualTo(request.getFoodCategories());
        assertThat(capturedPost.getQuantity()).isEqualTo(request.getQuantity());
        assertThat(capturedPost.getPickupLocation()).isEqualTo(request.getPickupLocation());
        assertThat(capturedPost.getExpiryDate()).isEqualTo(request.getExpiryDate());
        assertThat(capturedPost.getPickupFrom()).isEqualTo(request.getPickupFrom());
        assertThat(capturedPost.getPickupTo()).isEqualTo(request.getPickupTo());
        assertThat(capturedPost.getDescription()).isEqualTo(request.getDescription());
        assertThat(capturedPost.getDonor()).isEqualTo(donor);
    }

}
