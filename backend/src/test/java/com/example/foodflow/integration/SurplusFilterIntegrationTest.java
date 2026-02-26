package com.example.foodflow.integration;

import com.example.foodflow.FoodflowApplication;
import com.example.foodflow.model.dto.SurplusFilterRequest;
import com.example.foodflow.model.dto.SurplusResponse;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.FoodCategory;
import com.example.foodflow.model.types.FoodType;
import com.example.foodflow.model.types.DietaryTag;
import com.example.foodflow.model.types.DietaryMatchMode;
import com.example.foodflow.model.types.Location;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.service.SurplusService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.hamcrest.Matchers.greaterThan;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.*;

@SpringBootTest(classes = FoodflowApplication.class)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Surplus Filter Integration Tests")
class SurplusFilterIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SurplusService surplusService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private User testDonor;
    private List<SurplusPost> testPosts;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(springSecurity())
            .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Clean up any existing test data
        surplusPostRepository.deleteAll();
        userRepository.deleteAll();

        // Create test donor
        testDonor = createTestUser("testdonor@foodflow.com", UserRole.DONOR);
        userRepository.save(testDonor);

        // Create test posts
        testPosts = createTestPosts();
        surplusPostRepository.saveAll(testPosts);
    }

    @AfterEach
    void cleanUp() {
        surplusPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User createTestUser(String email, UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setRole(role);
        user.setPassword("hashedpassword");
        return user;
    }

    private List<SurplusPost> createTestPosts() {
        List<SurplusPost> posts = new ArrayList<>();

        // Post 1: Fresh fruits, expires tomorrow, Montreal downtown
        SurplusPost post1 = new SurplusPost();
        post1.setTitle("Fresh Organic Apples");
        post1.setDescription("Fresh apples from local orchard");
        post1.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES));
        post1.setQuantity(new Quantity(5.0, Quantity.Unit.BAG));
        post1.setPickupLocation(new Location(45.5017, -73.5673, "Montreal Downtown"));
        post1.setExpiryDate(LocalDate.now().plusDays(1));
        post1.setPickupDate(LocalDate.now().plusDays(1));
        post1.setPickupFrom(LocalTime.of(9, 0));
        post1.setPickupTo(LocalTime.of(17, 0));
        post1.setStatus(PostStatus.AVAILABLE);
        post1.setFoodType(FoodType.PRODUCE);
        post1.setDietaryTags(new String[]{DietaryTag.VEGAN.name(), DietaryTag.GLUTEN_FREE.name()});
        post1.setDonor(testDonor);
        posts.add(post1);

        // Post 2: Bakery items, expires in 3 days, Montreal plateau
        SurplusPost post2 = new SurplusPost();
        post2.setTitle("End of Day Pastries");
        post2.setDescription("Fresh pastries and bread");
        post2.setFoodCategories(Set.of(FoodCategory.BAKERY_PASTRY));
        post2.setQuantity(new Quantity(15.0, Quantity.Unit.PIECE));
        post2.setPickupLocation(new Location(45.5200, -73.5800, "Plateau Montreal"));
        post2.setExpiryDate(LocalDate.now().plusDays(3));
        post2.setPickupDate(LocalDate.now());
        post2.setPickupFrom(LocalTime.of(16, 0));
        post2.setPickupTo(LocalTime.of(19, 0));
        post2.setStatus(PostStatus.READY_FOR_PICKUP);
        post2.setFoodType(FoodType.BAKERY);
        post2.setDietaryTags(new String[]{DietaryTag.VEGETARIAN.name()});
        post2.setOtpCode("123456");
        post2.setDonor(testDonor);
        posts.add(post2);

        // Post 3: Mixed categories, expires today, Verdun
        SurplusPost post3 = new SurplusPost();
        post3.setTitle("Mixed Food Package");
        post3.setDescription("Fruits and dairy items");
        post3.setFoodCategories(Set.of(FoodCategory.FRUITS_VEGETABLES, FoodCategory.DAIRY_COLD));
        post3.setQuantity(new Quantity(1.0, Quantity.Unit.BOX));
        post3.setPickupLocation(new Location(45.4740, -73.5800, "Verdun Montreal"));
        post3.setExpiryDate(LocalDate.now());
        post3.setPickupDate(LocalDate.now().plusDays(1));
        post3.setPickupFrom(LocalTime.of(10, 0));
        post3.setPickupTo(LocalTime.of(15, 0));
        post3.setStatus(PostStatus.AVAILABLE);
        post3.setFoodType(FoodType.DAIRY_EGGS);
        post3.setDietaryTags(new String[]{DietaryTag.KOSHER.name(), DietaryTag.HALAL.name()});
        post3.setDonor(testDonor);
        posts.add(post3);

        return posts;
    }

    @Nested
    @DisplayName("Service Layer Integration Tests")
    class ServiceLayerTests {

        @Test
        @DisplayName("Should filter by food category using service")
        void shouldFilterByFoodCategoryUsingService() {
            // Arrange
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.FRUITS_VEGETABLES.name()));

            // Act
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            // Assert
            assertEquals(2, results.size());
            assertTrue(results.stream().allMatch(r -> 
                r.getFoodCategories().contains(FoodCategory.FRUITS_VEGETABLES)));
        }

        @Test
        @DisplayName("Should filter by expiry date using service")
        void shouldFilterByExpiryDateUsingService() {
            // Arrange
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setExpiryBefore(LocalDate.now().plusDays(1));

            // Act
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            // Assert
            assertEquals(2, results.size()); // Posts expiring today and tomorrow
            assertTrue(results.stream().allMatch(r -> 
                !r.getExpiryDate().isAfter(LocalDate.now().plusDays(1))));
        }

        @Test
        @DisplayName("Should combine multiple filters using service")
        void shouldCombineMultipleFiltersUsingService() {
            // Arrange
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.FRUITS_VEGETABLES.name()));
            filter.setStatus(PostStatus.AVAILABLE.name());
            filter.setExpiryAfter(LocalDate.now().minusDays(1));

            // Act
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            // Assert
            assertTrue(results.size() >= 1);
            assertTrue(results.stream().allMatch(r -> 
                r.getFoodCategories().contains(FoodCategory.FRUITS_VEGETABLES) &&
                r.getStatus() == PostStatus.AVAILABLE));
        }

        @Test
        @DisplayName("Should filter by food type using service")
        void shouldFilterByFoodTypeUsingService() {
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodTypes(List.of(FoodType.BAKERY));
            filter.setStatus(null);

            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            assertEquals(1, results.size());
            assertEquals(FoodType.BAKERY, results.get(0).getFoodType());
        }

        @Test
        @DisplayName("Should filter by dietary tags with ANY matching")
        void shouldFilterByDietaryTagsAnyUsingService() {
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setDietaryTags(List.of(DietaryTag.VEGAN, DietaryTag.KOSHER));
            filter.setDietaryMatch(DietaryMatchMode.ANY);

            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            assertEquals(2, results.size());
        }

        @Test
        @DisplayName("Should filter by dietary tags with ALL matching")
        void shouldFilterByDietaryTagsAllUsingService() {
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setDietaryTags(List.of(DietaryTag.KOSHER, DietaryTag.HALAL));
            filter.setDietaryMatch(DietaryMatchMode.ALL);

            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            assertEquals(1, results.size());
            assertTrue(results.get(0).getDietaryTags().containsAll(List.of(DietaryTag.KOSHER, DietaryTag.HALAL)));
        }
    }

    @Nested
    @DisplayName("Controller Integration Tests via HTTP")
    class ControllerIntegrationTests {

        @Test
        @WithMockUser(authorities = "RECEIVER")
        @DisplayName("Should filter via POST endpoint")
        void shouldFilterViaPostEndpoint() throws Exception {
            // Arrange
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.BAKERY_PASTRY.name()));
            filter.setStatus(PostStatus.READY_FOR_PICKUP.name());

            // Act & Assert
            mockMvc.perform(post("/api/surplus/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("End of Day Pastries"))
                .andExpect(jsonPath("$[0].status").value("READY_FOR_PICKUP"));
        }

        @Test
        @WithMockUser(authorities = "RECEIVER")
        @DisplayName("Should handle empty search results gracefully")
        void shouldHandleEmptySearchResultsGracefully() throws Exception {
            // Arrange - Search for category that doesn't exist in test data
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.PACKAGED_PANTRY.name()));

            // Act & Assert
            mockMvc.perform(post("/api/surplus/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @WithMockUser(authorities = "RECEIVER")
        @DisplayName("Should handle invalid date format in GET request")
        void shouldHandleInvalidDateFormatInGetRequest() throws Exception {
            // Act & Assert - Should not crash, just ignore invalid date
            mockMvc.perform(get("/api/surplus/search")
                    .param("expiryBefore", "not-a-date")
                    .param("foodCategories", "FRUITS_VEGETABLES"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        }
    }

    @Nested
    @DisplayName("Real-World End-to-End Scenarios")
    class RealWorldScenariosTests {

        @Test
        @WithMockUser(authorities = "RECEIVER")
        @DisplayName("Should find fresh produce near user location")
        void shouldFindFreshProduceNearUserLocation() throws Exception {
            // Scenario: User wants fresh fruits/vegetables within 2 days
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.FRUITS_VEGETABLES.name()));
            filter.setExpiryBefore(LocalDate.now().plusDays(2));
            filter.setStatus(PostStatus.AVAILABLE.name());

            // Act & Assert
            mockMvc.perform(post("/api/surplus/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[?(@.foodCategories[0] == 'FRUITS_VEGETABLES')]").exists())
                .andExpect(jsonPath("$[?(@.status == 'AVAILABLE')]").exists());
        }

        @Test
        @WithMockUser(authorities = "RECEIVER")
        @DisplayName("Should find ready-to-pickup items immediately")
        void shouldFindReadyToPickupItemsImmediately() throws Exception {
            // Scenario: User wants immediate pickup
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setStatus(PostStatus.READY_FOR_PICKUP.name());

            // Act & Assert
            mockMvc.perform(post("/api/surplus/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("READY_FOR_PICKUP"))
                .andExpect(jsonPath("$[0].title").value("End of Day Pastries"));
        }
    }

    @Nested
    @DisplayName("Database and Specification Integration")
    class DatabaseIntegrationTests {

        @Test
        @DisplayName("Should verify database query generation")
        void shouldVerifyDatabaseQueryGeneration() {
            // This test verifies that the specifications are properly converted to SQL
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.FRUITS_VEGETABLES.name()));
            filter.setStatus(PostStatus.AVAILABLE.name());

            // Act
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            // Assert
            assertNotNull(results);
            assertEquals(2, results.size());
            assertTrue(results.stream().allMatch(r -> 
                r.getFoodCategories().contains(FoodCategory.FRUITS_VEGETABLES)));
            assertTrue(results.stream().allMatch(r -> 
                r.getStatus() == PostStatus.AVAILABLE));
        }

        @Test
        @DisplayName("Should handle complex multi-criteria search")
        void shouldHandleComplexMultiCriteriaSearch() {
            // Filters that test multiple specifications combined
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setFoodCategories(List.of(FoodCategory.BAKERY_PASTRY.name()));
            filter.setExpiryAfter(LocalDate.now());
            filter.setStatus(PostStatus.READY_FOR_PICKUP.name());

            // Act
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);

            // Assert
            assertEquals(1, results.size());
            assertEquals("End of Day Pastries", results.get(0).getTitle());
            assertEquals(PostStatus.READY_FOR_PICKUP, results.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("Performance and Edge Cases")
    class PerformanceAndEdgeCasesTests {

        @Test
        @DisplayName("Should handle edge case date filters")
        void shouldHandleEdgeCaseDateFilters() {
            // Test with dates in the past
            SurplusFilterRequest filter = new SurplusFilterRequest();
            filter.setExpiryBefore(LocalDate.now().minusDays(1));

            // Should return empty results (no posts expire in the past in our test data)
            List<SurplusResponse> results = surplusService.searchSurplusPosts(filter);
            assertTrue(results.isEmpty() || results.stream().allMatch(r -> 
                !r.getExpiryDate().isAfter(LocalDate.now().minusDays(1))));
        }

        @Test
        @DisplayName("Should handle empty filter gracefully")
        void shouldHandleEmptyFilterGracefully() {
            SurplusFilterRequest emptyFilter = new SurplusFilterRequest();

            // Should not crash, should return some results
            assertDoesNotThrow(() -> {
                List<SurplusResponse> results = surplusService.searchSurplusPosts(emptyFilter);
                assertNotNull(results);
                assertTrue(results.size() >= 0);
            });
        }
    }
}
