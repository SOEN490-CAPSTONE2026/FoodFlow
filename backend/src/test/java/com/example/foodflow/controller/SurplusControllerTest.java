package com.example.foodflow.controller;

import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.Quantity;
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
import java.util.HashSet;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
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


        response = new SurplusResponse();
        response.setId(1L);
        response.setTitle("Vegetable Lasagna");

        HashSet<FoodCategory> foodCategories2 = new HashSet<FoodCategory>();
        foodCategories2.add(FoodCategory.PREPARED_MEALS);
        request.setFoodCategories(foodCategories2);
        
        response.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM)); 

        response.setExpiryDate(request.getExpiryDate());
        response.setPickupDate(request.getPickupDate());
        response.setPickupFrom(request.getPickupFrom()); 
        response.setPickupTo(request.getPickupTo()); 
        request.setPickupLocation(new Location(45.2903, -34.0987, "123 Main St"));
        response.setDescription("Vegetarian lasagna with spinach");
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
}