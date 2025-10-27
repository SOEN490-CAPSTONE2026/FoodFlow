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
import com.example.foodflow.model.types.PostStatus;
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
import java.util.*;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        request.setPickupDate(LocalDate.now());
        request.setPickupFrom(LocalTime.now().plusHours(3));
        request.setPickupTo(LocalTime.now().plusHours(5));
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
        savedPost.setPickupDate(request.getPickupDate());
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
        mockSavedPost.setPickupDate(request.getPickupDate());
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
        mockSavedPost.setPickupDate(request.getPickupDate());
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
        assertThat(capturedPost.getPickupDate()).isEqualTo(request.getPickupDate());
        assertThat(capturedPost.getPickupFrom()).isEqualTo(request.getPickupFrom());
        assertThat(capturedPost.getPickupTo()).isEqualTo(request.getPickupTo());
        assertThat(capturedPost.getDescription()).isEqualTo(request.getDescription());
        assertThat(capturedPost.getDonor()).isEqualTo(donor);
    }

    // ==================== Tests for completeSurplusPost - Story 8.1 ====================

    @Test
    void testCompleteSurplusPost_Success() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(surplusPostRepository.save(any(SurplusPost.class))).thenReturn(post);

        // When
        SurplusResponse response = surplusService.completeSurplusPost(1L, "123456", donor);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(PostStatus.COMPLETED);

        ArgumentCaptor<SurplusPost> postCaptor = ArgumentCaptor.forClass(SurplusPost.class);
        verify(surplusPostRepository).save(postCaptor.capture());
        assertThat(postCaptor.getValue().getStatus()).isEqualTo(PostStatus.COMPLETED);
    }

    @Test
    void testCompleteSurplusPost_PostNotFound_ThrowsException() {
        // Given
        when(surplusPostRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(999L, "123456", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Surplus post not found");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_UnauthorizedUser_ThrowsException() {
        // Given - Create another donor
        User otherDonor = new User();
        otherDonor.setId(2L);
        otherDonor.setEmail("other@test.com");
        otherDonor.setRole(UserRole.DONOR);

        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor); // Post belongs to original donor
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try to complete with different donor
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", otherDonor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("not authorized");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_WrongStatus_ThrowsException() {
        // Given - Post is AVAILABLE, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.AVAILABLE); // Wrong status
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("READY_FOR_PICKUP");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_InvalidOtp_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then - Try with wrong OTP
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "999999", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Invalid OTP code");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_NullOtp_ThrowsException() {
        // Given
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode(null); // No OTP set

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Invalid OTP code");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_ClaimedStatus_ThrowsException() {
        // Given - Post is CLAIMED, not READY_FOR_PICKUP
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.CLAIMED);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("READY_FOR_PICKUP")
            .hasMessageContaining("CLAIMED");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    @Test
    void testCompleteSurplusPost_CompletedStatus_ThrowsException() {
        // Given - Post is already COMPLETED
        SurplusPost post = new SurplusPost();
        post.setId(1L);
        post.setDonor(donor);
        post.setStatus(PostStatus.COMPLETED);
        post.setOtpCode("123456");

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(post));

        // When & Then
        assertThatThrownBy(() -> surplusService.completeSurplusPost(1L, "123456", donor))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("READY_FOR_PICKUP")
            .hasMessageContaining("COMPLETED");

        verify(surplusPostRepository, never()).save(any(SurplusPost.class));
    }

    // ==================== Tests for getAllAvailableSurplusPosts ====================

    @Test
    void testGetAllAvailableSurplusPosts_IncludesAvailableAndReadyForPickup() {
        // Given - Posts with different statuses
        SurplusPost availablePost = new SurplusPost();
        availablePost.setId(1L);
        availablePost.setDonor(donor);
        availablePost.setTitle("Available Food");
        availablePost.setStatus(PostStatus.AVAILABLE);
        availablePost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        availablePost.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        availablePost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        availablePost.setExpiryDate(LocalDate.now().plusDays(2));
        availablePost.setPickupDate(LocalDate.now());
        availablePost.setPickupFrom(LocalTime.of(9, 0));
        availablePost.setPickupTo(LocalTime.of(17, 0));

        SurplusPost readyPost = new SurplusPost();
        readyPost.setId(2L);
        readyPost.setDonor(donor);
        readyPost.setTitle("Ready Food");
        readyPost.setStatus(PostStatus.READY_FOR_PICKUP);
        readyPost.setOtpCode("123456");
        readyPost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        readyPost.setQuantity(new Quantity(3.0, Quantity.Unit.KILOGRAM));
        readyPost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        readyPost.setExpiryDate(LocalDate.now().plusDays(1));
        readyPost.setPickupDate(LocalDate.now());
        readyPost.setPickupFrom(LocalTime.of(10, 0));
        readyPost.setPickupTo(LocalTime.of(18, 0));

        when(surplusPostRepository.findByStatusIn(any()))
            .thenReturn(Arrays.asList(availablePost, readyPost));

        // When
        List<SurplusResponse> responses = surplusService.getAllAvailableSurplusPosts();

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(SurplusResponse::getTitle)
            .containsExactlyInAnyOrder("Available Food", "Ready Food");
        assertThat(responses).extracting(SurplusResponse::getStatus)
            .containsExactlyInAnyOrder(PostStatus.AVAILABLE, PostStatus.READY_FOR_PICKUP);

        // Verify the repository was called with correct statuses
        ArgumentCaptor<List<PostStatus>> statusCaptor = ArgumentCaptor.forClass(List.class);
        verify(surplusPostRepository).findByStatusIn(statusCaptor.capture());
        List<PostStatus> capturedStatuses = statusCaptor.getValue();
        assertThat(capturedStatuses).containsExactlyInAnyOrder(
            PostStatus.AVAILABLE,
            PostStatus.READY_FOR_PICKUP
        );
    }

    @Test
    void testGetAllAvailableSurplusPosts_ExcludesClaimedAndCompletedPosts() {
        // Given - Only AVAILABLE and READY_FOR_PICKUP posts should be returned
        SurplusPost availablePost = new SurplusPost();
        availablePost.setId(1L);
        availablePost.setDonor(donor);
        availablePost.setTitle("Available Food");
        availablePost.setStatus(PostStatus.AVAILABLE);
        availablePost.setFoodCategories(Set.of(FoodCategory.PREPARED_MEALS));
        availablePost.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        availablePost.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        availablePost.setExpiryDate(LocalDate.now().plusDays(2));
        availablePost.setPickupDate(LocalDate.now());
        availablePost.setPickupFrom(LocalTime.of(9, 0));
        availablePost.setPickupTo(LocalTime.of(17, 0));

        // Repository returns only posts with AVAILABLE or READY_FOR_PICKUP status
        when(surplusPostRepository.findByStatusIn(any()))
            .thenReturn(Collections.singletonList(availablePost));

        // When
        List<SurplusResponse> responses = surplusService.getAllAvailableSurplusPosts();

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getStatus()).isEqualTo(PostStatus.AVAILABLE);

        // Verify CLAIMED, COMPLETED, NOT_COMPLETED are NOT in the query
        ArgumentCaptor<List<PostStatus>> statusCaptor = ArgumentCaptor.forClass(List.class);
        verify(surplusPostRepository).findByStatusIn(statusCaptor.capture());
        List<PostStatus> capturedStatuses = statusCaptor.getValue();
        assertThat(capturedStatuses).doesNotContain(
            PostStatus.CLAIMED,
            PostStatus.COMPLETED,
            PostStatus.NOT_COMPLETED,
            PostStatus.EXPIRED
        );
    }

}
