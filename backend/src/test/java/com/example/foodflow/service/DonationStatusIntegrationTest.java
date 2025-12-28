package com.example.foodflow.service;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.*;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DonationStatusIntegrationTest {

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private SurplusService surplusService;

    @Autowired
    private SurplusPostSchedulerService schedulerService;

    private User donor;
    private User otherDonor;
    private User receiver;

    @BeforeEach
    void setUp() {
        // Create test donor
        donor = new User();
        donor.setEmail("donor@test.com");
        donor.setPassword("password123");
        donor.setRole(UserRole.DONOR);
        donor = userRepository.save(donor);

        // Create another donor for authorization testing
        otherDonor = new User();
        otherDonor.setEmail("other@test.com");
        otherDonor.setPassword("password123");
        otherDonor.setRole(UserRole.DONOR);
        otherDonor = userRepository.save(otherDonor);
        
        // Create test receiver for claims
        receiver = new User();
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("password123");
        receiver.setRole(UserRole.RECEIVER);
        receiver = userRepository.save(receiver);
    }

    @Test
    void testOtpCodeFieldPersistence() {
        // Create a surplus post
        SurplusPost post = createTestPost(PostStatus.AVAILABLE);
        post = surplusPostRepository.save(post);

        // Verify OTP is null initially
        assertNull(post.getOtpCode());

        // Set OTP code
        post.setOtpCode("123456");
        post = surplusPostRepository.save(post);

        // Verify OTP is persisted
        SurplusPost savedPost = surplusPostRepository.findById(post.getId()).orElseThrow();
        assertEquals("123456", savedPost.getOtpCode());
    }

    @Test
    void testSchedulerGeneratesOtpForReadyForPickup() {
        // Create a CLAIMED post with pickup time in the past
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        SurplusPost post = createTestPost(PostStatus.CLAIMED);
        post.setPickupDate(pastDate);
        post.setPickupFrom(startTime);
        post.setPickupTo(endTime);
        post = surplusPostRepository.save(post);
        
        // Create a claim with confirmed pickup date in the past (scheduler needs this!)
        Claim claim = new Claim(post, receiver);
        claim.setStatus(ClaimStatus.ACTIVE);
        claim.setConfirmedPickupDate(pastDate);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);
        claimRepository.save(claim);
        
        // Set createdAt to bypass grace period using reflection
        setCreatedAt(post, LocalDateTime.now().minusMinutes(3));
        post = surplusPostRepository.save(post);

        assertNull(post.getOtpCode());

        // Run scheduler to update status
        schedulerService.updatePostsToReadyForPickup();

        // Verify status updated and OTP generated
        SurplusPost updatedPost = surplusPostRepository.findById(post.getId()).orElseThrow();
        assertEquals(PostStatus.READY_FOR_PICKUP, updatedPost.getStatus());
        assertNotNull(updatedPost.getOtpCode());
        assertEquals(6, updatedPost.getOtpCode().length());
        assertTrue(updatedPost.getOtpCode().matches("^[0-9]{6}$"));
    }

    @Test
    void testSchedulerMarksNotCompletedWhenWindowEnds() {
        // Create a READY_FOR_PICKUP post with pickup window that ended
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(12, 0);
        
        SurplusPost post = createTestPost(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post.setPickupDate(pastDate);
        post.setPickupFrom(startTime);
        post.setPickupTo(endTime);
        post = surplusPostRepository.save(post);
        
        // Create a claim with confirmed pickup date that ended (scheduler needs this!)
        Claim claim = new Claim(post, receiver);
        claim.setStatus(ClaimStatus.ACTIVE);
        claim.setConfirmedPickupDate(pastDate);
        claim.setConfirmedPickupStartTime(startTime);
        claim.setConfirmedPickupEndTime(endTime);
        claimRepository.save(claim);
        
        // Set createdAt to bypass grace period using reflection
        setCreatedAt(post, LocalDateTime.now().minusMinutes(3));
        post = surplusPostRepository.save(post);

        // Run scheduler
        schedulerService.updatePostsToNotCompleted();

        // Verify status updated to NOT_COMPLETED
        SurplusPost updatedPost = surplusPostRepository.findById(post.getId()).orElseThrow();
        assertEquals(PostStatus.NOT_COMPLETED, updatedPost.getStatus());
    }

    @Test
    void testCompleteSurplusPost_Success() {
        // Create a READY_FOR_PICKUP post with OTP
        SurplusPost post = createTestPost(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post = surplusPostRepository.save(post);

        // Complete the post with correct OTP
        var response = surplusService.completeSurplusPost(post.getId(), "123456", donor);

        // Verify status is COMPLETED
        assertEquals(PostStatus.COMPLETED, response.getStatus());
        assertEquals(post.getId(), response.getId());

        // Verify in database
        SurplusPost completedPost = surplusPostRepository.findById(post.getId()).orElseThrow();
        assertEquals(PostStatus.COMPLETED, completedPost.getStatus());
    }

    @Test
    void testCompleteSurplusPost_InvalidOtp() {
        // Create a READY_FOR_PICKUP post with OTP
        SurplusPost post = createTestPost(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post = surplusPostRepository.save(post);

        // Try to complete with wrong OTP
        Long postId = post.getId();
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            surplusService.completeSurplusPost(postId, "999999", donor);
        });

        assertEquals("Invalid OTP code", exception.getMessage());

        // Verify status unchanged
        SurplusPost unchangedPost = surplusPostRepository.findById(postId).orElseThrow();
        assertEquals(PostStatus.READY_FOR_PICKUP, unchangedPost.getStatus());
    }

    @Test
    void testCompleteSurplusPost_UnauthorizedUser() {
        // Create a READY_FOR_PICKUP post with OTP
        SurplusPost post = createTestPost(PostStatus.READY_FOR_PICKUP);
        post.setOtpCode("123456");
        post = surplusPostRepository.save(post);

        // Try to complete with different donor
        Long postId = post.getId();
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            surplusService.completeSurplusPost(postId, "123456", otherDonor);
        });

        assertTrue(exception.getMessage().contains("not authorized"));

        // Verify status unchanged
        SurplusPost unchangedPost = surplusPostRepository.findById(postId).orElseThrow();
        assertEquals(PostStatus.READY_FOR_PICKUP, unchangedPost.getStatus());
    }

    @Test
    void testCompleteSurplusPost_WrongStatus() {
        // Create an AVAILABLE post (not READY_FOR_PICKUP)
        SurplusPost post = createTestPost(PostStatus.AVAILABLE);
        post.setOtpCode("123456");
        post = surplusPostRepository.save(post);

        // Try to complete
        Long postId = post.getId();
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            surplusService.completeSurplusPost(postId, "123456", donor);
        });

        assertTrue(exception.getMessage().contains("READY_FOR_PICKUP"));

        // Verify status unchanged
        SurplusPost unchangedPost = surplusPostRepository.findById(postId).orElseThrow();
        assertEquals(PostStatus.AVAILABLE, unchangedPost.getStatus());
    }

    private SurplusPost createTestPost(PostStatus status) {
        SurplusPost post = new SurplusPost();
        post.setDonor(donor);
        post.setTitle("Test Food");
        post.setDescription("Test Description");

        // Use mutable HashSet instead of immutable Set.of() for JPA @ElementCollection
        Set<FoodCategory> categories = new HashSet<>();
        categories.add(FoodCategory.FRUITS_VEGETABLES);
        post.setFoodCategories(categories);

        post.setQuantity(new Quantity(5.0, Quantity.Unit.KILOGRAM));
        post.setPickupLocation(new Location(45.5017, -73.5673, "Montreal, QC"));
        post.setExpiryDate(LocalDate.now().plusDays(2));
        post.setPickupDate(LocalDate.now());
        post.setPickupFrom(LocalTime.of(9, 0));
        post.setPickupTo(LocalTime.of(17, 0));
        post.setStatus(status);
        return post;
    }

    private void setCreatedAt(SurplusPost post, LocalDateTime createdAt) {
        try {
            Field field = SurplusPost.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(post, createdAt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set createdAt", e);
        }
    }
}
