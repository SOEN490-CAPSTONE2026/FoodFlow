package com.example.foodflow.service;
import com.example.foodflow.model.dto.ReferralRequest;
import com.example.foodflow.model.dto.ReferralResponse;
import com.example.foodflow.model.entity.Referral;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ReferralType;
import com.example.foodflow.repository.ReferralRepository;
import com.example.foodflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class ReferralServiceTest {
    @Mock
    private ReferralRepository referralRepository;
    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private ReferralService referralService;
    private User donorUser;
    private User receiverUser;
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
    }
    // ─── submitReferral ───────────────────────────────────────────────────────
    @Nested
    @DisplayName("submitReferral")
    class SubmitReferral {
        @Test
        @DisplayName("should save and return a SUGGEST_BUSINESS referral from donor")
        void submitReferral_SuggestBusiness_ShouldSaveAndReturn() {
            ReferralRequest request = new ReferralRequest();
            request.setReferralType(ReferralType.SUGGEST_BUSINESS);
            request.setBusinessName("Green Valley Bakery");
            request.setContactEmail("contact@bakery.com");
            request.setContactPhone("+1 555-123-4567");
            request.setMessage("They have lots of surplus bread.");
            Referral saved = new Referral();
            saved.setId(1L);
            saved.setSubmitter(donorUser);
            saved.setReferralType(ReferralType.SUGGEST_BUSINESS);
            saved.setBusinessName("Green Valley Bakery");
            saved.setContactEmail("contact@bakery.com");
            saved.setContactPhone("+1 555-123-4567");
            saved.setMessage("They have lots of surplus bread.");
            saved.setCreatedAt(LocalDateTime.now());
            when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));
            when(referralRepository.save(any(Referral.class))).thenReturn(saved);
            ReferralResponse response = referralService.submitReferral(request, 1L);
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getReferralType()).isEqualTo(ReferralType.SUGGEST_BUSINESS);
            assertThat(response.getBusinessName()).isEqualTo("Green Valley Bakery");
            assertThat(response.getContactEmail()).isEqualTo("contact@bakery.com");
            assertThat(response.getContactPhone()).isEqualTo("+1 555-123-4567");
            assertThat(response.getMessage()).isEqualTo("They have lots of surplus bread.");
            assertThat(response.getSubmittedByEmail()).isEqualTo("donor@example.com");
            verify(referralRepository).save(any(Referral.class));
        }
        @Test
        @DisplayName("should save and return an INVITE_COMMUNITY referral from receiver")
        void submitReferral_InviteCommunity_ShouldSaveAndReturn() {
            ReferralRequest request = new ReferralRequest();
            request.setReferralType(ReferralType.INVITE_COMMUNITY);
            request.setBusinessName("Community Food Pantry");
            request.setContactEmail("info@pantry.org");
            Referral saved = new Referral();
            saved.setId(2L);
            saved.setSubmitter(receiverUser);
            saved.setReferralType(ReferralType.INVITE_COMMUNITY);
            saved.setBusinessName("Community Food Pantry");
            saved.setContactEmail("info@pantry.org");
            saved.setCreatedAt(LocalDateTime.now());
            when(userRepository.findById(2L)).thenReturn(Optional.of(receiverUser));
            when(referralRepository.save(any(Referral.class))).thenReturn(saved);
            ReferralResponse response = referralService.submitReferral(request, 2L);
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(2L);
            assertThat(response.getReferralType()).isEqualTo(ReferralType.INVITE_COMMUNITY);
            assertThat(response.getBusinessName()).isEqualTo("Community Food Pantry");
            assertThat(response.getSubmittedByEmail()).isEqualTo("receiver@example.com");
            assertThat(response.getContactPhone()).isNull();
            assertThat(response.getMessage()).isNull();
        }
        @Test
        @DisplayName("should throw RuntimeException when submitter not found")
        void submitReferral_SubmitterNotFound_ShouldThrow() {
            ReferralRequest request = new ReferralRequest();
            request.setReferralType(ReferralType.SUGGEST_BUSINESS);
            request.setBusinessName("Some Business");
            request.setContactEmail("contact@business.com");
            when(userRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> referralService.submitReferral(request, 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Submitter not found");
            verify(referralRepository, never()).save(any());
        }
        @Test
        @DisplayName("should set all fields correctly on the saved referral")
        void submitReferral_ShouldSetAllFieldsOnEntity() {
            ReferralRequest request = new ReferralRequest();
            request.setReferralType(ReferralType.SUGGEST_BUSINESS);
            request.setBusinessName("Test Biz");
            request.setContactEmail("test@biz.com");
            request.setContactPhone("555-0000");
            request.setMessage("Optional note");
            Referral captured = new Referral();
            captured.setId(5L);
            captured.setSubmitter(donorUser);
            captured.setReferralType(ReferralType.SUGGEST_BUSINESS);
            captured.setBusinessName("Test Biz");
            captured.setContactEmail("test@biz.com");
            captured.setContactPhone("555-0000");
            captured.setMessage("Optional note");
            captured.setCreatedAt(LocalDateTime.now());
            when(userRepository.findById(1L)).thenReturn(Optional.of(donorUser));
            when(referralRepository.save(any(Referral.class))).thenAnswer(inv -> {
                Referral r = inv.getArgument(0);
                assertThat(r.getReferralType()).isEqualTo(ReferralType.SUGGEST_BUSINESS);
                assertThat(r.getBusinessName()).isEqualTo("Test Biz");
                assertThat(r.getContactEmail()).isEqualTo("test@biz.com");
                assertThat(r.getContactPhone()).isEqualTo("555-0000");
                assertThat(r.getMessage()).isEqualTo("Optional note");
                assertThat(r.getSubmitter()).isEqualTo(donorUser);
                return captured;
            });
            referralService.submitReferral(request, 1L);
            verify(referralRepository).save(any(Referral.class));
        }
    }
    // ─── getAllReferrals ──────────────────────────────────────────────────────
    @Nested
    @DisplayName("getAllReferrals")
    class GetAllReferrals {
        @Test
        @DisplayName("should return all referrals ordered by newest first")
        void getAllReferrals_ShouldReturnAllMapped() {
            Referral r1 = buildReferral(1L, donorUser, ReferralType.SUGGEST_BUSINESS,
                    "Bakery", "bakery@test.com", null, null,
                    LocalDateTime.of(2026, 3, 1, 10, 0));
            Referral r2 = buildReferral(2L, receiverUser, ReferralType.INVITE_COMMUNITY,
                    "Pantry", "pantry@test.com", "+1 555-0000", "Great org",
                    LocalDateTime.of(2026, 3, 2, 12, 0));
            when(referralRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Arrays.asList(r2, r1));
            List<ReferralResponse> result = referralService.getAllReferrals();
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getId()).isEqualTo(2L);
            assertThat(result.get(0).getReferralType()).isEqualTo(ReferralType.INVITE_COMMUNITY);
            assertThat(result.get(0).getSubmittedByEmail()).isEqualTo("receiver@example.com");
            assertThat(result.get(0).getContactPhone()).isEqualTo("+1 555-0000");
            assertThat(result.get(0).getMessage()).isEqualTo("Great org");
            assertThat(result.get(1).getId()).isEqualTo(1L);
            assertThat(result.get(1).getReferralType()).isEqualTo(ReferralType.SUGGEST_BUSINESS);
            assertThat(result.get(1).getSubmittedByEmail()).isEqualTo("donor@example.com");
        }
        @Test
        @DisplayName("should return empty list when no referrals exist")
        void getAllReferrals_NoReferrals_ShouldReturnEmptyList() {
            when(referralRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
            List<ReferralResponse> result = referralService.getAllReferrals();
            assertThat(result).isEmpty();
        }
        @Test
        @DisplayName("should correctly map createdAt timestamp")
        void getAllReferrals_ShouldMapCreatedAt() {
            LocalDateTime timestamp = LocalDateTime.of(2026, 3, 3, 9, 30);
            Referral r = buildReferral(3L, donorUser, ReferralType.SUGGEST_BUSINESS,
                    "Biz", "biz@test.com", null, null, timestamp);
            when(referralRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(r));
            List<ReferralResponse> result = referralService.getAllReferrals();
            assertThat(result.get(0).getCreatedAt()).isEqualTo(timestamp);
        }
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────
    private Referral buildReferral(Long id, User submitter, ReferralType type,
            String name, String email, String phone, String message,
            LocalDateTime createdAt) {
        Referral r = new Referral();
        r.setId(id);
        r.setSubmitter(submitter);
        r.setReferralType(type);
        r.setBusinessName(name);
        r.setContactEmail(email);
        r.setContactPhone(phone);
        r.setMessage(message);
        r.setCreatedAt(createdAt);
        return r;
    }
}
