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
    void testCreateSurplusPost_InvalidRequest_MissingFoodName() throws Exception {
        request.setFoodName(null);

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testCreateSurplusPost_InvalidRequest_InvalidQuantity() throws Exception {
        request.setQuantity(-5.0);

        mockMvc.perform(post("/api/surplus")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_Success() throws Exception {
        // Given - Use the new field structure
        SurplusResponse response1 = new SurplusResponse();
        response1.setId(1L);
        response1.setFoodName("Vegetable Lasagna");  
        response1.setFoodType("Prepared Meals");   
        response1.setQuantity(10.0);                 
        response1.setUnit("kg");                     
        response1.setLocation("123 Main St");
        response1.setDonorEmail("donor@test.com");
        response1.setCreatedAt(LocalDateTime.now());
        
        SurplusResponse response2 = new SurplusResponse();
        response2.setId(2L);
        response2.setFoodName("Fresh Apples");      
        response2.setFoodType("Fruits");             
        response2.setQuantity(5.0);               
        response2.setUnit("kg");                     
        response2.setLocation("456 Oak Ave");
        response2.setDonorEmail("donor@test.com");
        response2.setCreatedAt(LocalDateTime.now());

        List<SurplusResponse> userPosts = Arrays.asList(response1, response2);
        when(surplusService.getUserSurplusPosts(any())).thenReturn(userPosts);

        // When & Then - Update JSON path assertions
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].foodName").value("Vegetable Lasagna"))  
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].foodName").value("Fresh Apples"));      
    }

    @Test
    void testGetMyPosts_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "receiver@test.com", authorities = {"RECEIVER"})
    void testGetMyPosts_Forbidden_WrongRole() throws Exception {
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_EmptyList() throws Exception {
        when(surplusService.getUserSurplusPosts(any())).thenReturn(Arrays.asList());

        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(username = "donor1@test.com", authorities = {"DONOR"})
    void testGetMyPosts_OnlyReturnsCurrentUserPosts() throws Exception {
        // Given
        SurplusResponse userPost1 = new SurplusResponse();
        userPost1.setId(1L);
        userPost1.setFoodName("Vegetables");
        userPost1.setFoodType("Produce");
        userPost1.setQuantity(5.0);
        userPost1.setUnit("kg");
        userPost1.setDonorEmail("donor1@test.com");
        userPost1.setCreatedAt(LocalDateTime.now());

        SurplusResponse userPost2 = new SurplusResponse();
        userPost2.setId(2L);
        userPost2.setFoodName("Bread");
        userPost2.setFoodType("Bakery");
        userPost2.setQuantity(2.0);
        userPost2.setUnit("loaves");
        userPost2.setDonorEmail("donor1@test.com");
        userPost2.setCreatedAt(LocalDateTime.now());

        List<SurplusResponse> currentUserPosts = Arrays.asList(userPost1, userPost2);
        when(surplusService.getUserSurplusPosts(any())).thenReturn(currentUserPosts);

        // When & Then
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].donorEmail").value("donor1@test.com"))
                .andExpect(jsonPath("$[1].donorEmail").value("donor1@test.com"));
        
        verify(surplusService).getUserSurplusPosts(any());
    }

    @Test
    @WithMockUser(username = "donor@test.com", authorities = {"DONOR"})
    void testGetMyPosts_LargeNumberOfPosts() throws Exception {
        // Given
        List<SurplusResponse> largePosts = new java.util.ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            SurplusResponse post = new SurplusResponse();
            post.setId((long) i);
            post.setFoodName("Food " + i);           
            post.setFoodType("Type " + i);           
            post.setQuantity((double) i);            
            post.setUnit("kg");                      
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
                .andExpect(jsonPath("$[0].foodName").value("Food 1"))    
                .andExpect(jsonPath("$[9].foodName").value("Food 10"));  
    }

    @Test
    void testGetMyPosts_NoAuthentication() throws Exception {
        mockMvc.perform(get("/api/surplus/my-posts"))
                .andExpect(status().isForbidden());
        
        verify(surplusService, never()).getUserSurplusPosts(any());
    }
}