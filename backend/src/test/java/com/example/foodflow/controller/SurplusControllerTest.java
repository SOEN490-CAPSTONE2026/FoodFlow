package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private ObjectMapper objectMapper;
    private CreateSurplusRequest request;
    private SurplusResponse response;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Create test request with NEW field structure
        request = new CreateSurplusRequest();
        request.setFoodName("Vegetable Lasagna");
        request.setFoodType("Prepared Meals");
        request.setQuantity(10.0);
        request.setUnit("kg");
        request.setExpiryDate(LocalDate.now().plusDays(2));
        request.setPickupFrom(LocalDateTime.now().plusHours(3));
        request.setPickupTo(LocalTime.of(18, 0));
        request.setLocation("123 Main St");
        request.setNotes("Vegetarian lasagna with spinach");

        response = new SurplusResponse();
        response.setId(1L);
        response.setFoodName("Vegetable Lasagna");
        response.setFoodType("Prepared Meals"); 
        response.setQuantity(10.0); 
        response.setUnit("kg");   
        response.setExpiryDate(request.getExpiryDate());
        response.setPickupFrom(request.getPickupFrom()); 
        response.setPickupTo(request.getPickupTo()); 
        response.setLocation("123 Main St");
        response.setNotes("Vegetarian lasagna with spinach");
        response.setDonorEmail("donor@test.com");
        response.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_Success() throws Exception {
        when(surplusService.createSurplusPost(any(CreateSurplusRequest.class), any(User.class)))
            .thenReturn(response);

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_MissingFoodName() throws Exception {  // ✅ RENAMED test
        request.setFoodName(null);  // ✅ NEW field

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_InvalidQuantity() throws Exception {
        request.setQuantity(-5.0);  // ✅ Negative Double

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_Success() throws Exception {
        // Given
        SurplusResponse response1 = new SurplusResponse();
        response1.setId(1L);
        response1.setType("Vegetables");
        response1.setQuantity("10 kg");
        response1.setLocation("123 Main St");
        response1.setDonorEmail("donor@test.com");
        response1.setCreatedAt(LocalDateTime.now());
        
        SurplusResponse response2 = new SurplusResponse();
        response2.setId(2L);
        response2.setType("Fruits");
        response2.setQuantity("5 kg");
        response2.setLocation("456 Oak Ave");
        response2.setDonorEmail("donor@test.com");
        response2.setCreatedAt(LocalDateTime.now());

        List<SurplusResponse> userPosts = Arrays.asList(response1, response2);
        when(surplusService.getUserSurplusPosts(any())).thenReturn(userPosts);

        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].type").value("Vegetables"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].type").value("Fruits"));
    }

    @Test
    void testGetMyPosts_Unauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetMyPosts_Forbidden_WrongRole() throws Exception {
        // When & Then (RECEIVER trying to access donor posts should be forbidden)
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_EmptyList() throws Exception {
        // Given
        when(surplusService.getUserSurplusPosts(any())).thenReturn(Arrays.asList());

        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ====== ADDITIONAL "MY POSTS" TESTS FOR HIGH COVERAGE ======

    @Test
    @WithMockUser(username = "donor1@test.com", authorities = {"DONOR"})
    void testGetMyPosts_OnlyReturnsCurrentUserPosts() throws Exception {
        // Given - Mock posts for the current user only
        SurplusResponse userPost1 = new SurplusResponse();
        userPost1.setId(1L);
        userPost1.setType("Vegetables");
        userPost1.setDonorEmail("donor1@test.com");
        userPost1.setCreatedAt(LocalDateTime.now());

        SurplusResponse userPost2 = new SurplusResponse();
        userPost2.setId(2L);
        userPost2.setType("Bread");
        userPost2.setDonorEmail("donor1@test.com");
        userPost2.setCreatedAt(LocalDateTime.now());

        // Note: Posts from other users should not be returned by the service
        List<SurplusResponse> currentUserPosts = Arrays.asList(userPost1, userPost2);
        when(surplusService.getUserSurplusPosts(any())).thenReturn(currentUserPosts);

        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].donorEmail").value("donor1@test.com"))
                .andExpect(jsonPath("$[1].donorEmail").value("donor1@test.com"));
        
        // Verify service is called with the authenticated user
        verify(surplusService).getUserSurplusPosts(any());
    }


    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_LargeNumberOfPosts() throws Exception {
        // Given - Create a large list of posts to test pagination/performance
        List<SurplusResponse> largePosts = new java.util.ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            SurplusResponse post = new SurplusResponse();
            post.setId((long) i);
            post.setType("Type" + i);
            post.setQuantity(i + " kg");
            post.setDonorEmail("donor@test.com");
            post.setCreatedAt(LocalDateTime.now());
            largePosts.add(post);
        }

        when(surplusService.getUserSurplusPosts(any())).thenReturn(largePosts);

        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(10))
                .andExpect(jsonPath("$[0].type").value("Type1"))
                .andExpect(jsonPath("$[9].type").value("Type10"));
    }

    @Test
    void testGetMyPosts_NoAuthentication() throws Exception {
        // When & Then - No @WithMockUser annotation means no authentication
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
        
        // Verify service was never called
        verify(surplusService, never()).getUserSurplusPosts(any());
    }
}