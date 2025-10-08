package com.example.foodflow.service;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.UserRole;
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
        request.setFoodName("Vegetable Lasagna");
        request.setFoodType("Prepared Meals");
        request.setQuantity(10.0);
        request.setUnit("kg");
        request.setExpiryDate(LocalDateTime.now().plusDays(2));
        request.setPickupFrom(LocalDateTime.now().plusHours(3));
        request.setPickupTo(LocalTime.of(18, 0));
        request.setLocation("123 Main St");
        request.setNotes("Vegetarian lasagna");
    }

    @Test
    void testCreateSurplusPost_Success() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setFoodName(request.getFoodName());
        savedPost.setFoodType(request.getFoodType());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setUnit(request.getUnit());
        savedPost.setLocation(request.getLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupFrom(request.getPickupFrom());
        savedPost.setPickupTo(request.getPickupTo());
        savedPost.setNotes(request.getNotes());

        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getFoodName()).isEqualTo("Vegetable Lasagna");
        assertThat(response.getFoodType()).isEqualTo("Prepared Meals");
        assertThat(response.getQuantity()).isEqualTo(10.0);
        assertThat(response.getUnit()).isEqualTo("kg");
        assertThat(response.getLocation()).isEqualTo("123 Main St");
        assertThat(response.getDonorEmail()).isEqualTo("donor@test.com");

        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_SetsCorrectDonor() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setFoodName("Vegetable Lasagna");
        mockSavedPost.setFoodType("Prepared Meals");
        mockSavedPost.setQuantity(10.0);
        mockSavedPost.setUnit("kg");
        mockSavedPost.setLocation("123 Main St");
        mockSavedPost.setExpiryDate(request.getExpiryDate());
        mockSavedPost.setPickupFrom(request.getPickupFrom());
        mockSavedPost.setPickupTo(request.getPickupTo());
        mockSavedPost.setNotes(request.getNotes());
        
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();
        
        assertThat(capturedPost.getDonor()).isEqualTo(donor);
        assertThat(capturedPost.getFoodName()).isEqualTo("Vegetable Lasagna");
        assertThat(capturedPost.getFoodType()).isEqualTo("Prepared Meals");
        assertThat(capturedPost.getQuantity()).isEqualTo(10.0);
    }

    @Test
    void testCreateSurplusPost_MapsAllFields() {
        // Given
        SurplusPost mockSavedPost = new SurplusPost();
        mockSavedPost.setId(1L);
        mockSavedPost.setDonor(donor);
        mockSavedPost.setFoodName("Test");
        mockSavedPost.setFoodType("Test");
        mockSavedPost.setQuantity(1.0);
        mockSavedPost.setUnit("kg");
        mockSavedPost.setLocation("Test");
        mockSavedPost.setExpiryDate(LocalDateTime.now());
        mockSavedPost.setPickupFrom(LocalDateTime.now());
        mockSavedPost.setPickupTo(LocalTime.now());
        mockSavedPost.setNotes("Test");
        
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(mockSavedPost);

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();
        
        assertThat(capturedPost.getFoodName()).isEqualTo(request.getFoodName());
        assertThat(capturedPost.getFoodType()).isEqualTo(request.getFoodType());
        assertThat(capturedPost.getQuantity()).isEqualTo(request.getQuantity());
        assertThat(capturedPost.getUnit()).isEqualTo(request.getUnit());
        assertThat(capturedPost.getLocation()).isEqualTo(request.getLocation());
        assertThat(capturedPost.getExpiryDate()).isEqualTo(request.getExpiryDate());
        assertThat(capturedPost.getPickupFrom()).isEqualTo(request.getPickupFrom());
        assertThat(capturedPost.getPickupTo()).isEqualTo(request.getPickupTo());
        assertThat(capturedPost.getNotes()).isEqualTo(request.getNotes());
    }


}
