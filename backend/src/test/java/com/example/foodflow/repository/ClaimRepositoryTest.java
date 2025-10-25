package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.Quantity;
import com.example.foodflow.model.types.Location;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ClaimRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ClaimRepository claimRepository;

    private User donor;
    private User receiver;
    private SurplusPost surplusPost;

    @BeforeEach
    void setUp() {
        // Create donor user
        donor = new User();
        donor.setEmail("donor@test.com");
        donor.setPassword("password123");
        donor.setRole(UserRole.DONOR);
        entityManager.persist(donor);

        // Create receiver user
        receiver = new User();
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("password123");
        receiver.setRole(UserRole.RECEIVER);
        entityManager.persist(receiver);

        // Create surplus post
        surplusPost = new SurplusPost();
        surplusPost.setTitle("Test Food");
        surplusPost.setQuantity(new Quantity(10.0, Quantity.Unit.KILOGRAM));
        surplusPost.setExpiryDate(LocalDate.now().plusDays(7));
        surplusPost.setDescription("Test description");
        surplusPost.setPickupLocation(new Location(45.5017, -73.5673, "123 Test St, Montreal"));
        surplusPost.setPickupDate(LocalDate.now().plusDays(1));
        surplusPost.setPickupFrom(LocalTime.of(9, 0));
        surplusPost.setPickupTo(LocalTime.of(17, 0));
        surplusPost.setDonor(donor);
        entityManager.persist(surplusPost);

        entityManager.flush();
    }

    @Test
    void testFindByReceiverIdAndStatus_ReturnsClaims() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        entityManager.persist(claim);
        entityManager.flush();

        // When
        List<Claim> claims = claimRepository.findByReceiverIdAndStatus(receiver.getId(), ClaimStatus.ACTIVE);

        // Then
        assertThat(claims).hasSize(1);
        assertThat(claims.get(0).getReceiver().getId()).isEqualTo(receiver.getId());
    }

    @Test
    void testFindBySurplusPostIdAndStatus_ReturnsMatchingClaim() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        entityManager.persist(claim);
        entityManager.flush();

        // When
        Optional<Claim> result = claimRepository.findBySurplusPostIdAndStatus(
            surplusPost.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getSurplusPost().getId()).isEqualTo(surplusPost.getId());
    }

    @Test
    void testFindBySurplusPostIdAndStatus_ReturnsEmpty_WhenNoMatch() {
        // When
        Optional<Claim> result = claimRepository.findBySurplusPostIdAndStatus(
            surplusPost.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void testFindBySurplusPostId_ReturnsAllClaimsForPost() {
        // Given
        User receiver2 = new User();
        receiver2.setEmail("receiver2@test.com");
        receiver2.setPassword("password123");
        receiver2.setRole(UserRole.RECEIVER);
        entityManager.persist(receiver2);

        Claim claim1 = new Claim(surplusPost, receiver);
        entityManager.persist(claim1);

        Claim claim2 = new Claim(surplusPost, receiver2);
        entityManager.persist(claim2);

        entityManager.flush();

        // When
        List<Claim> claims = claimRepository.findBySurplusPostId(surplusPost.getId());

        // Then
        assertThat(claims).hasSize(2);
    }

    @Test
    void testExistsBySurplusPostIdAndStatus_ReturnsTrue_WhenExists() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        entityManager.persist(claim);
        entityManager.flush();

        // When
        boolean exists = claimRepository.existsBySurplusPostIdAndStatus(
            surplusPost.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void testExistsBySurplusPostIdAndStatus_ReturnsFalse_WhenNotExists() {
        // When
        boolean exists = claimRepository.existsBySurplusPostIdAndStatus(
            surplusPost.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(exists).isFalse();
    }

    @Test
    void testFindReceiverClaimsWithDetails_ReturnsClaimsWithJoinedData() {
        // Given
        Claim claim = new Claim(surplusPost, receiver);
        entityManager.persist(claim);
        entityManager.flush();

        // When
        List<Claim> claims = claimRepository.findReceiverClaimsWithDetails(
            receiver.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(claims).hasSize(1);
        assertThat(claims.get(0).getSurplusPost()).isNotNull();
        assertThat(claims.get(0).getReceiver().getId()).isEqualTo(receiver.getId());
    }

    @Test
    void testFindReceiverClaimsWithDetails_ReturnsEmpty_WhenNoMatchingClaims() {
        // When
        List<Claim> claims = claimRepository.findReceiverClaimsWithDetails(
            receiver.getId(), ClaimStatus.ACTIVE
        );

        // Then
        assertThat(claims).isEmpty();
    }
}
