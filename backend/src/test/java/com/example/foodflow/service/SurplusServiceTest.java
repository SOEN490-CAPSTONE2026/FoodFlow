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
        organization.setOrganizationType(OrganizationType.RESTAURANT);  // ✅ FIXED: setOrganizationType

        // Create test donor
        donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);
        donor.setOrganization(organization);

        // Create test request
        request = new CreateSurplusRequest();
        request.setType("Vegetables");
        request.setQuantity("10 kg");
        request.setExpiryDate(LocalDateTime.now().plusDays(2));
        request.setPickupTime(LocalDateTime.now().plusHours(3));
        request.setLocation("123 Main St");
    }

    @Test
    void testCreateSurplusPost_Success() {
        // Given
        SurplusPost savedPost = new SurplusPost();
        savedPost.setId(1L);
        savedPost.setDonor(donor);
        savedPost.setType(request.getType());
        savedPost.setQuantity(request.getQuantity());
        savedPost.setLocation(request.getLocation());
        savedPost.setExpiryDate(request.getExpiryDate());
        savedPost.setPickupTime(request.getPickupTime());
        // ✅ REMOVED: setCreatedAt() - it's set automatically

        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(savedPost);

        // When
        SurplusResponse response = surplusService.createSurplusPost(request, donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getType()).isEqualTo("Vegetables");
        assertThat(response.getQuantity()).isEqualTo("10 kg");
        assertThat(response.getLocation()).isEqualTo("123 Main St");
        assertThat(response.getDonorEmail()).isEqualTo("donor@test.com");

        // Verify repository was called
        verify(surplusPostRepository, times(1)).save(any(SurplusPost.class));
    }

    @Test
    void testCreateSurplusPost_SetsCorrectDonor() {
        // Given
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(new SurplusPost());

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();
        
        assertThat(capturedPost.getDonor()).isEqualTo(donor);
        assertThat(capturedPost.getType()).isEqualTo("Vegetables");
        assertThat(capturedPost.getQuantity()).isEqualTo("10 kg");
    }

    @Test
    void testCreateSurplusPost_MapsAllFields() {
        // Given
        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(new SurplusPost());

        // When
        surplusService.createSurplusPost(request, donor);

        // Then
        verify(surplusPostRepository).save(postCaptor.capture());
        SurplusPost capturedPost = postCaptor.getValue();
        
        assertThat(capturedPost.getType()).isEqualTo(request.getType());
        assertThat(capturedPost.getQuantity()).isEqualTo(request.getQuantity());
        assertThat(capturedPost.getLocation()).isEqualTo(request.getLocation());
        assertThat(capturedPost.getExpiryDate()).isEqualTo(request.getExpiryDate());
        assertThat(capturedPost.getPickupTime()).isEqualTo(request.getPickupTime());
    }
}
