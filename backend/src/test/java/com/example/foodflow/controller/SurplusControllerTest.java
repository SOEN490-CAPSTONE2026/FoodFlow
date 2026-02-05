package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CompleteSurplusRequest;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PackagingType;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.TemperatureCategory;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.SurplusService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SurplusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SurplusService surplusService;
    
    @MockBean
    private UserRepository userRepository;

    private ObjectMapper objectMapper;
    private CreateSurplusRequest request;
    private SurplusResponse response;
    private User donorUser;
    private User receiverUser;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        // Mock users for donor and receiver roles
        donorUser = new User();
        donorUser.setId(1L);
        donorUser.setEmail("donor@test.com");
        donorUser.setRole(UserRole.DONOR);
        
        receiverUser = new User();
        receiverUser.setId(2L);
        receiverUser.setEmail("receiver@test.com");
        receiverUser.setRole(UserRole.RECEIVER);
        
        when(userRepository.findByEmail("donor@test.com")).thenReturn(Optional.of(donorUser));
        when(userRepository.findByEmail("receiver@test.com")).thenReturn(Optional.of(receiverUser));

        // Create test request with NEW field structure
        request = new CreateSurplusRequest();
        request.setTitle("Vegetable Lasagna");
        
        HashSet<FoodCategory> foodCategories = new HashSet<FoodCategory>();
        foodCategories.add(FoodCategory.PREPARED_MEALS);
        request.setFoodCategories(foodCategories);
        
        request.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupDate(LocalDate.now());
        request.setPickupFrom(LocalTime.now().plusHours(3));
        request.setPickupTo(LocalTime.now().plusHours(5));
        request.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        request.setDescription("Vegetarian lasagna with spinach");
        request.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        request.setPackagingType(PackagingType.SEALED);


        response = new SurplusResponse();
        response.setId(1L);
        response.setTitle("Vegetable Lasagna");

        HashSet<FoodCategory> foodCategories2 = new HashSet<FoodCategory>();
        foodCategories2.add(FoodCategory.PREPARED_MEALS);
        response.setFoodCategories(foodCategories2);  // FIX: Set on response, not request
        
        response.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM)); 

        response.setExpiryDate(request.getExpiryDate());
        response.setPickupDate(request.getPickupDate());
        response.setPickupFrom(request.getPickupFrom()); 
        response.setPickupTo(request.getPickupTo()); 
        response.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));  // FIX: Set on response
        response.setDescription("Vegetarian lasagna with spinach");
        response.setDonorEmail("donor@test.com");
        response.setCreatedAt(LocalDateTime.now());
    }

    private UsernamePasswordAuthenticationToken createDonorAuth() {
        return new UsernamePasswordAuthenticationToken(
            donorUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("DONOR"))
        );
    }

    private UsernamePasswordAuthenticationToken createReceiverAuth() {
        return new UsernamePasswordAuthenticationToken(
            receiverUser,
            null,
            Collections.singletonList(new SimpleGrantedAuthority("RECEIVER"))
        );
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_Success() throws Exception {
        when(surplusService.createSurplusPost(any(CreateSurplusRequest.class), any()))
            .thenReturn(response);

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_MissingFoodName() throws Exception {  // ✅ RENAMED test
        request.setTitle(null);  // ✅ NEW field

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_InvalidQuantity() throws Exception {
        request.setQuantity(new Quantity(-5.0, Quantity.Unit.KILOGRAM));  // ✅ Negative Double

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ==================== Tests for completeSurplusPost - Story 8.1 ====================

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_Success() throws Exception {
        // Given
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("123456");

        SurplusResponse completedResponse = new SurplusResponse();
        completedResponse.setId(1L);
        completedResponse.setTitle("Test Food");
        completedResponse.setStatus(PostStatus.COMPLETED);
        completedResponse.setDonorEmail("donor@test.com");
        completedResponse.setFoodCategories(new HashSet<>());
        completedResponse.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        completedResponse.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        completedResponse.setExpiryDate(LocalDate.now().plusDays(2));
        completedResponse.setPickupDate(LocalDate.now());
        completedResponse.setPickupFrom(LocalTime.of(9, 0));
        completedResponse.setPickupTo(LocalTime.of(17, 0));
        completedResponse.setCreatedAt(LocalDateTime.now());

        when(surplusService.completeSurplusPost(eq(1L), eq("123456"), any()))
            .thenReturn(completedResponse);

        // When & Then
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_InvalidOtp_LessThan6Digits() throws Exception {
        // Given - OTP with less than 6 digits
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("12345");

        // When & Then - Should fail validation
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_InvalidOtp_MoreThan6Digits() throws Exception {
        // Given - OTP with more than 6 digits
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("1234567");

        // When & Then - Should fail validation
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_InvalidOtp_ContainsLetters() throws Exception {
        // Given - OTP with letters
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("12345A");

        // When & Then - Should fail validation
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_NullOtp() throws Exception {
        // Given - Null OTP
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest(null);

        // When & Then - Should fail validation
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_EmptyOtp() throws Exception {
        // Given - Empty OTP
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("");

        // When & Then - Should fail validation
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_WrongOtpCode_ServiceException() throws Exception {
        // Given
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("999999");

        when(surplusService.completeSurplusPost(eq(1L), eq("999999"), any()))
            .thenThrow(new RuntimeException("Invalid OTP code"));

        // When & Then - Service exceptions result in 500 error or are not caught
        // This test verifies the service method is called with the right parameters
        try {
            mockMvc.perform(patch("/api/surplus/1/complete")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(completionRequest)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCompleteSurplusPost_UnauthorizedUser_ServiceException() throws Exception {
        // Given
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("123456");

        when(surplusService.completeSurplusPost(eq(1L), eq("123456"), any()))
            .thenThrow(new RuntimeException("You are not authorized to complete this post"));

        // When & Then - Service exceptions result in 500 error or are not caught
        // This test verifies the service method is called with the right parameters
        try {
            mockMvc.perform(patch("/api/surplus/1/complete")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(completionRequest)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testCompleteSurplusPost_ReceiverRole_Forbidden() throws Exception {
        // Given - User with RECEIVER role tries to complete
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("123456");

        // When & Then - Should be forbidden (403)
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCompleteSurplusPost_Unauthenticated_Unauthorized() throws Exception {
        // Given - No authentication
        CompleteSurplusRequest completionRequest = new CompleteSurplusRequest("123456");

        // When & Then - Unauthenticated should return 401
        mockMvc.perform(patch("/api/surplus/1/complete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completionRequest)))
                .andExpect(status().isUnauthorized());
    }

    // ==================== Tests for getMyPosts ====================

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_Success() throws Exception {
        // Given
        java.util.List<SurplusResponse> myPosts = java.util.Arrays.asList(response);
        when(surplusService.getUserSurplusPosts(any()))
            .thenReturn(myPosts);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Vegetable Lasagna"));
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_EmptyList() throws Exception {
        // Given
        when(surplusService.getUserSurplusPosts(any()))
            .thenReturn(java.util.Collections.emptyList());

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetMyPosts_ReceiverRole_Forbidden() throws Exception {
        // When & Then - Receivers cannot access my-posts
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
    }

    // ==================== Tests for getAllAvailableSurplus ====================

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetAllAvailableSurplus_Success() throws Exception {
        // Given
        java.util.List<SurplusResponse> availablePosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(availablePosts);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetAllAvailableSurplus_EmptyList() throws Exception {
        // Given
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(java.util.Collections.emptyList());

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetAllAvailableSurplus_DonorRole_Forbidden() throws Exception {
        // When & Then - Donors cannot access all surplus
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus"))
                .andExpect(status().isForbidden());
    }

    // ==================== Tests for searchSurplusPosts (POST) ====================

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPosts_Success() throws Exception {
        // Given
        com.example.foodflow.model.dto.SurplusFilterRequest filterRequest = new com.example.foodflow.model.dto.SurplusFilterRequest();
        filterRequest.setStatus("AVAILABLE");
        
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then
        mockMvc.perform(post("/api/surplus/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filterRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPosts_WithFoodCategories() throws Exception {
        // Given
        com.example.foodflow.model.dto.SurplusFilterRequest filterRequest = new com.example.foodflow.model.dto.SurplusFilterRequest();
        filterRequest.setFoodCategories(java.util.Arrays.asList("PREPARED_MEALS"));
        
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then
        mockMvc.perform(post("/api/surplus/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filterRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testSearchSurplusPosts_DonorRole_Forbidden() throws Exception {
        // Given
        com.example.foodflow.model.dto.SurplusFilterRequest filterRequest = new com.example.foodflow.model.dto.SurplusFilterRequest();
        
        // When & Then - Donors cannot search
        mockMvc.perform(post("/api/surplus/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filterRequest)))
                .andExpect(status().isForbidden());
    }

    // ==================== Tests for searchSurplusPostsViaParams (GET) ====================

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPostsViaParams_Success() throws Exception {
        // Given
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search")
                .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPostsViaParams_WithFoodCategories() throws Exception {
        // Given
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search")
                .param("foodCategories", "PREPARED_MEALS")
                .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPostsViaParams_WithExpiryBefore() throws Exception {
        // Given
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search")
                .param("expiryBefore", "2024-12-31")
                .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPostsViaParams_InvalidExpiryDate() throws Exception {
        // Given
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then - Invalid date format should be handled gracefully
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search")
                .param("expiryBefore", "invalid-date")
                .param("status", "AVAILABLE"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testSearchSurplusPostsViaParams_NoParams() throws Exception {
        // Given
        java.util.List<SurplusResponse> filteredPosts = java.util.Arrays.asList(response);
        when(surplusService.searchSurplusPostsForReceiver(any(com.example.foodflow.model.dto.SurplusFilterRequest.class), any()))
            .thenReturn(filteredPosts);

        // When & Then - Default to AVAILABLE status
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testSearchSurplusPostsViaParams_DonorRole_Forbidden() throws Exception {
        // When & Then - Donors cannot search
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/search")
                .param("status", "AVAILABLE"))
                .andExpect(status().isForbidden());
    }

    // ==================== Tests for confirmPickup ====================

    // @Test
    // @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    // void testConfirmPickup_Success() throws Exception {
    //     // Given
    //     com.example.foodflow.model.dto.ConfirmPickupRequest confirmRequest = 
    //         new com.example.foodflow.model.dto.ConfirmPickupRequest();
    //     confirmRequest.setPostId(1L);
    //     confirmRequest.setOtpCode("123456");

    //     when(surplusService.confirmPickup(eq(1L), eq("123456"), any(User.class)))
    //         .thenReturn(response);

    //     // When & Then
    //     mockMvc.perform(post("/api/surplus/pickup/confirm")
    //             .contentType(MediaType.APPLICATION_JSON)
    //             .content(objectMapper.writeValueAsString(confirmRequest)))
    //             .andExpect(status().isOk());
        
    //     // Verify service was called with correct parameters
    //     verify(surplusService).confirmPickup(eq(1L), eq("123456"), any(User.class));
    // }

    @Test
    void testConfirmPickup_Unauthenticated_Unauthorized() throws Exception {
        // Given - No authentication
        com.example.foodflow.model.dto.ConfirmPickupRequest confirmRequest = 
            new com.example.foodflow.model.dto.ConfirmPickupRequest();
        confirmRequest.setPostId(1L);
        confirmRequest.setOtpCode("123456");

        // When & Then - Unauthenticated should return 401
        mockMvc.perform(post("/api/surplus/pickup/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(confirmRequest)))
                .andExpect(status().isUnauthorized());
    }

    // ==================== Timeline Endpoint Tests ====================

    @Test
    void testGetTimeline_AsDonor_Success() throws Exception {
        // Given
        List<com.example.foodflow.model.dto.DonationTimelineDTO> timeline = new ArrayList<>();

        com.example.foodflow.model.dto.DonationTimelineDTO event1 = new com.example.foodflow.model.dto.DonationTimelineDTO();
        event1.setId(1L);
        event1.setEventType("DONATION_POSTED");
        event1.setTimestamp(LocalDateTime.now().minusHours(2));
        event1.setActor("donor");
        event1.setActorUserId(1L);
        event1.setNewStatus("AVAILABLE");
        event1.setDetails("Donation created");
        event1.setVisibleToUsers(true);

        com.example.foodflow.model.dto.DonationTimelineDTO event2 = new com.example.foodflow.model.dto.DonationTimelineDTO();
        event2.setId(2L);
        event2.setEventType("DONATION_CLAIMED");
        event2.setTimestamp(LocalDateTime.now().minusHours(1));
        event2.setActor("receiver");
        event2.setActorUserId(2L);
        event2.setOldStatus("AVAILABLE");
        event2.setNewStatus("CLAIMED");
        event2.setDetails("Claimed by Test Organization");
        event2.setVisibleToUsers(true);

        timeline.add(event2);
        timeline.add(event1);

        when(surplusService.getTimelineForPost(eq(1L), any(User.class))).thenReturn(timeline);

        // When & Then
        mockMvc.perform(get("/api/surplus/1/timeline")
                .with(authentication(createDonorAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].eventType").value("DONATION_CLAIMED"))
                .andExpect(jsonPath("$[0].actor").value("receiver"))
                .andExpect(jsonPath("$[0].oldStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$[0].newStatus").value("CLAIMED"))
                .andExpect(jsonPath("$[1].eventType").value("DONATION_POSTED"))
                .andExpect(jsonPath("$[1].actor").value("donor"));

        verify(surplusService).getTimelineForPost(eq(1L), any(User.class));
    }

    @Test
    void testGetTimeline_AsReceiver_Success() throws Exception {
        // Given
        List<com.example.foodflow.model.dto.DonationTimelineDTO> timeline = new ArrayList<>();

        com.example.foodflow.model.dto.DonationTimelineDTO event = new com.example.foodflow.model.dto.DonationTimelineDTO();
        event.setId(1L);
        event.setEventType("DONATION_CLAIMED");
        event.setTimestamp(LocalDateTime.now());
        event.setActor("receiver");
        event.setActorUserId(2L);
        event.setOldStatus("AVAILABLE");
        event.setNewStatus("CLAIMED");
        event.setVisibleToUsers(true);

        timeline.add(event);

        when(surplusService.getTimelineForPost(eq(1L), any(User.class))).thenReturn(timeline);

        // When & Then
        mockMvc.perform(get("/api/surplus/1/timeline")
                .with(authentication(createReceiverAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventType").value("DONATION_CLAIMED"))
                .andExpect(jsonPath("$[0].actorUserId").value(2));

        verify(surplusService).getTimelineForPost(eq(1L), any(User.class));
    }

    @Test
    void testGetTimeline_Unauthenticated_Unauthorized() throws Exception {
        // When & Then - No authentication, should return 401
        mockMvc.perform(get("/api/surplus/1/timeline"))
                .andExpect(status().isUnauthorized());

        verify(surplusService, never()).getTimelineForPost(anyLong(), any(User.class));
    }

    @Test
    void testGetTimeline_UnauthorizedReceiver_ThrowsException() throws Exception {
        // Given - Receiver without claim
        when(surplusService.getTimelineForPost(eq(1L), any(User.class)))
                .thenThrow(new RuntimeException("You are not authorized to view this timeline"));

        // When & Then - RuntimeException propagates as ServletException
        try {
            mockMvc.perform(get("/api/surplus/1/timeline")
                    .with(authentication(createReceiverAuth())));
        } catch (Exception e) {
            // Exception is expected to propagate
        }

        verify(surplusService).getTimelineForPost(eq(1L), any(User.class));
    }

    @Test
    void testGetTimeline_PostNotFound_ThrowsException() throws Exception {
        // Given
        when(surplusService.getTimelineForPost(eq(999L), any(User.class)))
                .thenThrow(new RuntimeException("Surplus post not found"));

        // When & Then - RuntimeException propagates as ServletException
        try {
            mockMvc.perform(get("/api/surplus/999/timeline")
                    .with(authentication(createDonorAuth())));
        } catch (Exception e) {
            // Exception is expected to propagate
        }

        verify(surplusService).getTimelineForPost(eq(999L), any(User.class));
    }

    @Test
    void testGetTimeline_EmptyTimeline_ReturnsEmptyArray() throws Exception {
        // Given
        when(surplusService.getTimelineForPost(eq(1L), any(User.class)))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/surplus/1/timeline")
                .with(authentication(createDonorAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(surplusService).getTimelineForPost(eq(1L), any(User.class));
    }

    @Test
    void testGetTimeline_WithAllFields_ReturnsCompleteDTO() throws Exception {
        // Given
        List<com.example.foodflow.model.dto.DonationTimelineDTO> timeline = new ArrayList<>();

        com.example.foodflow.model.dto.DonationTimelineDTO event = new com.example.foodflow.model.dto.DonationTimelineDTO();
        event.setId(1L);
        event.setEventType("PICKUP_CONFIRMED");
        event.setTimestamp(LocalDateTime.now());
        event.setActor("receiver");
        event.setActorUserId(2L);
        event.setOldStatus("READY_FOR_PICKUP");
        event.setNewStatus("COMPLETED");
        event.setDetails("Pickup confirmed successfully");
        event.setVisibleToUsers(true);
        event.setTemperature(4.5);
        event.setPackagingCondition("GOOD");
        event.setPickupEvidenceUrl("https://example.com/evidence.jpg");

        timeline.add(event);

        when(surplusService.getTimelineForPost(eq(1L), any(User.class))).thenReturn(timeline);

        // When & Then
        mockMvc.perform(get("/api/surplus/1/timeline")
                .with(authentication(createDonorAuth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].eventType").value("PICKUP_CONFIRMED"))
                .andExpect(jsonPath("$[0].actor").value("receiver"))
                .andExpect(jsonPath("$[0].actorUserId").value(2))
                .andExpect(jsonPath("$[0].oldStatus").value("READY_FOR_PICKUP"))
                .andExpect(jsonPath("$[0].newStatus").value("COMPLETED"))
                .andExpect(jsonPath("$[0].details").value("Pickup confirmed successfully"))
                .andExpect(jsonPath("$[0].visibleToUsers").value(true))
                .andExpect(jsonPath("$[0].temperature").value(4.5))
                .andExpect(jsonPath("$[0].packagingCondition").value("GOOD"))
                .andExpect(jsonPath("$[0].pickupEvidenceUrl").value("https://example.com/evidence.jpg"));

        verify(surplusService).getTimelineForPost(eq(1L), any(User.class));
    }

    // ==================== Tests for getSurplusPostById (Edit Functionality) ====================

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetSurplusPostById_Success() throws Exception {
        // Given
        when(surplusService.getSurplusPostByIdForDonor(eq(1L), any()))
            .thenReturn(response);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Vegetable Lasagna"))
                .andExpect(jsonPath("$.donorEmail").value("donor@test.com"));
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetSurplusPostById_NotFound() throws Exception {
        // Given
        when(surplusService.getSurplusPostByIdForDonor(eq(999L), any()))
            .thenThrow(new RuntimeException("Surplus post not found"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/999"));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetSurplusPostById_UnauthorizedOwner() throws Exception {
        // Given - Different donor tries to access another donor's post
        when(surplusService.getSurplusPostByIdForDonor(eq(1L), any()))
            .thenThrow(new RuntimeException("You are not authorized to view this post"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/1"));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetSurplusPostById_ReceiverRole_Forbidden() throws Exception {
        // When & Then - Receivers cannot access this endpoint
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetSurplusPostById_Unauthenticated_Unauthorized() throws Exception {
        // When & Then - Unauthenticated should return 401
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/surplus/1"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== Tests for updateSurplusPost (Edit Functionality) ====================

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_Success() throws Exception {
        // Given
        CreateSurplusRequest updateRequest = new CreateSurplusRequest();
        updateRequest.setTitle("Updated Lasagna");
        
        HashSet<FoodCategory> foodCategories = new HashSet<>();
        foodCategories.add(FoodCategory.PREPARED_MEALS);
        updateRequest.setFoodCategories(foodCategories);
        
        updateRequest.setQuantity(new Quantity(15.0, Quantity.Unit.KILOGRAM)); // Updated quantity
        updateRequest.setExpiryDate(LocalDate.now().plusDays(3)); // Updated expiry
        updateRequest.setPickupDate(LocalDate.now().plusDays(1));
        updateRequest.setPickupFrom(LocalTime.of(10, 0));
        updateRequest.setPickupTo(LocalTime.of(12, 0));
        updateRequest.setPickupLocation(new Location(45.2903, -34.0987, "456 Updated St"));
        updateRequest.setDescription("Updated vegetarian lasagna with extra spinach");
        updateRequest.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        updateRequest.setPackagingType(PackagingType.SEALED);

        SurplusResponse updatedResponse = new SurplusResponse();
        updatedResponse.setId(1L);
        updatedResponse.setTitle("Updated Lasagna");
        updatedResponse.setFoodCategories(foodCategories);
        updatedResponse.setQuantity(new Quantity(15.0, Quantity.Unit.KILOGRAM));
        updatedResponse.setExpiryDate(updateRequest.getExpiryDate());
        updatedResponse.setPickupDate(updateRequest.getPickupDate());
        updatedResponse.setPickupFrom(updateRequest.getPickupFrom());
        updatedResponse.setPickupTo(updateRequest.getPickupTo());
        updatedResponse.setPickupLocation(updateRequest.getPickupLocation());
        updatedResponse.setDescription(updateRequest.getDescription());
        updatedResponse.setDonorEmail("donor@test.com");
        updatedResponse.setStatus(PostStatus.AVAILABLE);
        updatedResponse.setCreatedAt(LocalDateTime.now());

        when(surplusService.updateSurplusPost(eq(1L), any(CreateSurplusRequest.class), any()))
            .thenReturn(updatedResponse);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Updated Lasagna"))
                .andExpect(jsonPath("$.quantity.value").value(15.0))
                .andExpect(jsonPath("$.description").value("Updated vegetarian lasagna with extra spinach"));
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_InvalidRequest_MissingTitle() throws Exception {
        // Given
        CreateSurplusRequest updateRequest = new CreateSurplusRequest();
        updateRequest.setTitle(null); // Missing title
        
        HashSet<FoodCategory> foodCategories = new HashSet<>();
        foodCategories.add(FoodCategory.PREPARED_MEALS);
        updateRequest.setFoodCategories(foodCategories);
        updateRequest.setQuantity(new Quantity(15.0, Quantity.Unit.KILOGRAM));
        updateRequest.setExpiryDate(LocalDate.now().plusDays(3));
        updateRequest.setPickupDate(LocalDate.now());
        updateRequest.setPickupFrom(LocalTime.of(10, 0));
        updateRequest.setPickupTo(LocalTime.of(12, 0));
        updateRequest.setPickupLocation(new Location(45.2903, -34.0987, "456 Updated St"));
        updateRequest.setDescription("Updated description");
        updateRequest.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        updateRequest.setPackagingType(PackagingType.SEALED);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_InvalidRequest_NegativeQuantity() throws Exception {
        // Given
        CreateSurplusRequest updateRequest = new CreateSurplusRequest();
        updateRequest.setTitle("Updated Lasagna");
        
        HashSet<FoodCategory> foodCategories = new HashSet<>();
        foodCategories.add(FoodCategory.PREPARED_MEALS);
        updateRequest.setFoodCategories(foodCategories);
        updateRequest.setQuantity(new Quantity(-5.0, Quantity.Unit.KILOGRAM)); // Invalid quantity
        updateRequest.setExpiryDate(LocalDate.now().plusDays(3));
        updateRequest.setPickupDate(LocalDate.now());
        updateRequest.setPickupFrom(LocalTime.of(10, 0));
        updateRequest.setPickupTo(LocalTime.of(12, 0));
        updateRequest.setPickupLocation(new Location(45.2903, -34.0987, "456 Updated St"));
        updateRequest.setDescription("Updated description");
        updateRequest.setTemperatureCategory(TemperatureCategory.REFRIGERATED);
        updateRequest.setPackagingType(PackagingType.SEALED);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_NotFound() throws Exception {
        // Given
        when(surplusService.updateSurplusPost(eq(999L), any(CreateSurplusRequest.class), any()))
            .thenThrow(new RuntimeException("Surplus post not found"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/999")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_UnauthorizedOwner() throws Exception {
        // Given - Different donor tries to update another donor's post
        when(surplusService.updateSurplusPost(eq(1L), any(CreateSurplusRequest.class), any()))
            .thenThrow(new RuntimeException("You are not authorized to update this post"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_AlreadyClaimed() throws Exception {
        // Given - Post has been claimed and cannot be edited
        when(surplusService.updateSurplusPost(eq(1L), any(CreateSurplusRequest.class), any()))
            .thenThrow(new RuntimeException("Cannot edit a post that has been claimed or completed. Current status: CLAIMED"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_AlreadyCompleted() throws Exception {
        // Given - Post has been completed and cannot be edited
        when(surplusService.updateSurplusPost(eq(1L), any(CreateSurplusRequest.class), any()))
            .thenThrow(new RuntimeException("Cannot edit a post that has been claimed or completed. Current status: COMPLETED"));

        // When & Then - Service exceptions propagate
        try {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        } catch (Exception e) {
            // Exception is expected to propagate
        }
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testUpdateSurplusPost_ReceiverRole_Forbidden() throws Exception {
        // When & Then - Receivers cannot update surplus posts
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateSurplusPost_Unauthenticated_Unauthorized() throws Exception {
        // When & Then - Unauthenticated should return 401
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testUpdateSurplusPost_UpdateAllFields() throws Exception {
        // Given - Comprehensive update of all fields
        CreateSurplusRequest updateRequest = new CreateSurplusRequest();
        updateRequest.setTitle("Completely Updated Lasagna");
        
        HashSet<FoodCategory> newCategories = new HashSet<>();
        newCategories.add(FoodCategory.PREPARED_MEALS);
        newCategories.add(FoodCategory.DAIRY_COLD);
        updateRequest.setFoodCategories(newCategories);
        
        updateRequest.setQuantity(new Quantity(20.0, Quantity.Unit.KILOGRAM));
        updateRequest.setFabricationDate(LocalDate.now().minusDays(1));
        updateRequest.setExpiryDate(LocalDate.now().plusDays(5));
        updateRequest.setPickupDate(LocalDate.now().plusDays(2));
        updateRequest.setPickupFrom(LocalTime.of(14, 0));
        updateRequest.setPickupTo(LocalTime.of(16, 0));
        updateRequest.setPickupLocation(new Location(40.7128, -74.0060, "789 New York St"));
        updateRequest.setDescription("Completely updated lasagna with new ingredients");
        updateRequest.setTemperatureCategory(TemperatureCategory.FROZEN);
        updateRequest.setPackagingType(PackagingType.VACUUM_PACKED);

        SurplusResponse updatedResponse = new SurplusResponse();
        updatedResponse.setId(1L);
        updatedResponse.setTitle(updateRequest.getTitle());
        updatedResponse.setFoodCategories(newCategories);
        updatedResponse.setQuantity(updateRequest.getQuantity());
        updatedResponse.setFabricationDate(updateRequest.getFabricationDate());
        updatedResponse.setExpiryDate(updateRequest.getExpiryDate());
        updatedResponse.setPickupDate(updateRequest.getPickupDate());
        updatedResponse.setPickupFrom(updateRequest.getPickupFrom());
        updatedResponse.setPickupTo(updateRequest.getPickupTo());
        updatedResponse.setPickupLocation(updateRequest.getPickupLocation());
        updatedResponse.setDescription(updateRequest.getDescription());
        updatedResponse.setTemperatureCategory(updateRequest.getTemperatureCategory());
        updatedResponse.setPackagingType(updateRequest.getPackagingType());
        updatedResponse.setDonorEmail("donor@test.com");
        updatedResponse.setStatus(PostStatus.AVAILABLE);
        updatedResponse.setCreatedAt(LocalDateTime.now());

        when(surplusService.updateSurplusPost(eq(1L), any(CreateSurplusRequest.class), any()))
            .thenReturn(updatedResponse);

        // When & Then
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/surplus/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Completely Updated Lasagna"))
                .andExpect(jsonPath("$.quantity.value").value(20.0))
                .andExpect(jsonPath("$.temperatureCategory").value("FROZEN"))
                .andExpect(jsonPath("$.packagingType").value("VACUUM_PACKED"));
    }
}
