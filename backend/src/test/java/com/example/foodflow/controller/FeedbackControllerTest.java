package com.example.foodflow.controller;

import com.example.foodflow.model.dto.FeedbackRequestDTO;
import com.example.foodflow.model.dto.FeedbackResponseDTO;
import com.example.foodflow.model.dto.UserRatingDTO;
import com.example.foodflow.model.dto.AdminRatingDashboardDTO;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.FeedbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FeedbackControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private FeedbackService feedbackService;
    
    @MockBean
    private UserRepository userRepository;
    
    private User donorUser;
    private User receiverUser;
    private User adminUser;
    private UsernamePasswordAuthenticationToken donorAuth;
    private UsernamePasswordAuthenticationToken receiverAuth;
    private UsernamePasswordAuthenticationToken adminAuth;
    
    @BeforeEach
    void setUp() {
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setEmail("donor@example.com");
        donorUser.setRole(UserRole.DONOR);
        
        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setEmail("receiver@example.com");
        receiverUser.setRole(UserRole.RECEIVER);
        
        adminUser = new User();
        adminUser.setId(3L);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(UserRole.ADMIN);
        
        donorAuth = new UsernamePasswordAuthenticationToken(
            donorUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("DONOR"))
        );
        
        receiverAuth = new UsernamePasswordAuthenticationToken(
            receiverUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("RECEIVER"))
        );
        
        adminAuth = new UsernamePasswordAuthenticationToken(
            adminUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
    
    @Test
    void submitFeedback_ValidRequest_ShouldReturn201() throws Exception {
        // Given
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setClaimId(100L);
        request.setRating(5);
        request.setReviewText("Excellent transaction");
        
        FeedbackResponseDTO response = new FeedbackResponseDTO();
        response.setId(1L);
        response.setClaimId(100L);
        response.setRating(5);
        response.setReviewText("Excellent transaction");
        response.setCreatedAt(LocalDateTime.now());
        
        when(feedbackService.submitFeedback(any(FeedbackRequestDTO.class), any(User.class)))
            .thenReturn(response);
        
        // When & Then
        mockMvc.perform(post("/api/feedback")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.reviewText").value("Excellent transaction"));
    }
    
    @Test
    void submitFeedback_InvalidRequest_ShouldReturn400() throws Exception {
        // Given
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setClaimId(100L);
        request.setRating(5);
        
        when(feedbackService.submitFeedback(any(FeedbackRequestDTO.class), any(User.class)))
            .thenThrow(new IllegalArgumentException("Invalid claim"));
        
        // When & Then
        mockMvc.perform(post("/api/feedback")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void submitFeedback_DuplicateFeedback_ShouldReturn409() throws Exception {
        // Given
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setClaimId(100L);
        request.setRating(5);
        
        when(feedbackService.submitFeedback(any(FeedbackRequestDTO.class), any(User.class)))
            .thenThrow(new IllegalStateException("Feedback already submitted"));
        
        // When & Then
        mockMvc.perform(post("/api/feedback")
                .with(authentication(donorAuth))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }
    
    @Test
    void getFeedbackForClaim_ValidRequest_ShouldReturn200() throws Exception {
        // Given
        List<FeedbackResponseDTO> feedbackList = new ArrayList<>();
        FeedbackResponseDTO feedback = new FeedbackResponseDTO();
        feedback.setId(1L);
        feedback.setClaimId(100L);
        feedback.setRating(4);
        feedbackList.add(feedback);
        
        when(feedbackService.getFeedbackForClaim(anyLong(), any(User.class)))
            .thenReturn(feedbackList);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/claim/100")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].claimId").value(100));
    }
    
    @Test
    void getFeedbackForClaim_ClaimNotFound_ShouldReturn404() throws Exception {
        // Given
        when(feedbackService.getFeedbackForClaim(anyLong(), any(User.class)))
            .thenThrow(new IllegalArgumentException("Claim not found"));
        
        // When & Then
        mockMvc.perform(get("/api/feedback/claim/999")
                .with(authentication(donorAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void getMyFeedback_ShouldReturn200() throws Exception {
        // Given
        List<FeedbackResponseDTO> feedbackList = new ArrayList<>();
        FeedbackResponseDTO feedback1 = new FeedbackResponseDTO();
        feedback1.setId(1L);
        feedback1.setRating(5);
        feedbackList.add(feedback1);
        
        FeedbackResponseDTO feedback2 = new FeedbackResponseDTO();
        feedback2.setId(2L);
        feedback2.setRating(4);
        feedbackList.add(feedback2);
        
        when(feedbackService.getFeedbackForUser(any(User.class)))
            .thenReturn(feedbackList);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/my-reviews")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }
    
    @Test
    void getUserRating_OwnRating_ShouldReturn200() throws Exception {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(donorUser));
        
        UserRatingDTO rating = new UserRatingDTO();
        rating.setUserId(1L);
        rating.setAverageRating(4.5);
        rating.setTotalReviews(10);
        
        when(feedbackService.getUserRating(any(User.class)))
            .thenReturn(rating);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/rating/1")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.totalReviews").value(10));
    }
    
    @Test
    void getUserRating_OtherUserAsNonAdmin_ShouldReturn403() throws Exception {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(receiverUser));
        
        // When & Then - Donor trying to access receiver's rating
        mockMvc.perform(get("/api/feedback/rating/2")
                .with(authentication(donorAuth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getUserRating_UserNotFound_ShouldReturn404() throws Exception {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());
        
        // When & Then
        mockMvc.perform(get("/api/feedback/rating/999")
                .with(authentication(donorAuth)))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void getMyRating_ShouldReturn200() throws Exception {
        // Given
        UserRatingDTO rating = new UserRatingDTO();
        rating.setUserId(1L);
        rating.setAverageRating(4.8);
        rating.setTotalReviews(25);
        
        when(feedbackService.getUserRating(any(User.class)))
            .thenReturn(rating);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/my-rating")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.8))
                .andExpect(jsonPath("$.totalReviews").value(25));
    }
    
    @Test
    void canProvideFeedback_True_ShouldReturn200() throws Exception {
        // Given
        when(feedbackService.canProvideFeedback(anyLong(), any(User.class)))
            .thenReturn(true);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/can-review/100")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }
    
    @Test
    void canProvideFeedback_False_ShouldReturn200() throws Exception {
        // Given
        when(feedbackService.canProvideFeedback(anyLong(), any(User.class)))
            .thenReturn(false);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/can-review/100")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
    
    @Test
    void getClaimsNeedingFeedback_ShouldReturn200() throws Exception {
        // Given
        List<Claim> claims = new ArrayList<>();
        Claim claim1 = new Claim();
        claim1.setId(1L);
        claims.add(claim1);
        
        when(feedbackService.getClaimsNeedingFeedback(any(User.class)))
            .thenReturn(claims);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/pending")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }
    
    @Test
    void getRecentFeedback_WithUserId_ShouldReturn200() throws Exception {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(receiverUser));
        
        List<FeedbackResponseDTO> feedbackList = new ArrayList<>();
        FeedbackResponseDTO feedback = new FeedbackResponseDTO();
        feedback.setId(1L);
        feedback.setRating(5);
        feedbackList.add(feedback);
        
        when(feedbackService.getRecentFeedback(any(User.class), anyInt()))
            .thenReturn(feedbackList);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/recent?userId=2&limit=5")
                .with(authentication(receiverAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }
    
    @Test
    void getRecentFeedback_WithoutUserId_ShouldReturn200() throws Exception {
        // Given
        List<FeedbackResponseDTO> feedbackList = new ArrayList<>();
        
        when(feedbackService.getRecentFeedback(any(User.class), anyInt()))
            .thenReturn(feedbackList);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/recent")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
    
    
    @Test
    void isFeedbackComplete_True_ShouldReturn200() throws Exception {
        // Given
        when(feedbackService.isFeedbackComplete(anyLong()))
            .thenReturn(true);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/complete/100")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }
    
    @Test
    void isFeedbackComplete_False_ShouldReturn200() throws Exception {
        // Given
        when(feedbackService.isFeedbackComplete(anyLong()))
            .thenReturn(false);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/complete/100")
                .with(authentication(donorAuth)))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
    
    @Test
    void getAdminUserRatings_AsAdmin_ShouldReturn200() throws Exception {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(receiverUser));
        
        List<FeedbackResponseDTO> feedbackList = new ArrayList<>();
        FeedbackResponseDTO feedback = new FeedbackResponseDTO();
        feedback.setId(1L);
        feedback.setRating(4);
        feedbackList.add(feedback);
        
        when(feedbackService.getAllFeedbackForUser(any(User.class)))
            .thenReturn(feedbackList);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/users/2/ratings")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }
    
    @Test
    void getAdminUserRatings_AsNonAdmin_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/users/2/ratings")
                .with(authentication(donorAuth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getAdminRatingDashboard_AsAdmin_ShouldReturn200() throws Exception {
        // Given
        AdminRatingDashboardDTO dashboard = new AdminRatingDashboardDTO();
        
        when(feedbackService.getAdminRatingDashboard(anyString(), anyInt()))
            .thenReturn(dashboard);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/dashboard?filter=top-rated&limit=20")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk());
    }
    
    @Test
    void getAdminRatingDashboard_AsNonAdmin_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/dashboard")
                .with(authentication(donorAuth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getUsersBelowThreshold_AsAdmin_ShouldReturn200() throws Exception {
        // Given
        List<UserRatingDTO> lowRatedUsers = new ArrayList<>();
        UserRatingDTO user = new UserRatingDTO();
        user.setUserId(2L);
        user.setAverageRating(1.5);
        user.setTotalReviews(5);
        lowRatedUsers.add(user);
        
        when(feedbackService.getUsersBelowThreshold(anyDouble(), anyInt()))
            .thenReturn(lowRatedUsers);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/below-threshold?threshold=2.0&minReviews=3")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].averageRating").value(1.5));
    }
    
    @Test
    void getUsersBelowThreshold_AsNonAdmin_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/below-threshold")
                .with(authentication(receiverAuth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void getFlaggedRatings_AsAdmin_ShouldReturn200() throws Exception {
        // Given
        List<FeedbackResponseDTO> flaggedFeedback = new ArrayList<>();
        FeedbackResponseDTO feedback = new FeedbackResponseDTO();
        feedback.setId(1L);
        feedback.setRating(1);
        flaggedFeedback.add(feedback);
        
        when(feedbackService.getFlaggedFeedback())
            .thenReturn(flaggedFeedback);
        
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/flagged")
                .with(authentication(adminAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1));
    }
    
    @Test
    void getFlaggedRatings_AsNonAdmin_ShouldReturn403() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/feedback/admin/ratings/flagged")
                .with(authentication(donorAuth)))
                .andExpect(status().isForbidden());
    }
    
    @Test
    void submitFeedback_Unauthenticated_ShouldReturn403() throws Exception {
        // Given
        FeedbackRequestDTO request = new FeedbackRequestDTO();
        request.setClaimId(100L);
        request.setRating(5);
        
        // When & Then
        mockMvc.perform(post("/api/feedback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
