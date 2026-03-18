package com.example.foodflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.entity.VerificationStatus;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.types.ClaimStatus;
import com.example.foodflow.model.types.PostStatus;
import com.example.foodflow.repository.ClaimRepository;
import com.example.foodflow.repository.SurplusPostRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

class SupportContextBuilderTest {

    @Test
    void buildSupportContext_includesOrgDonationAndClaim() {
        SurplusPostRepository surplusPostRepository = Mockito.mock(SurplusPostRepository.class);
        ClaimRepository claimRepository = Mockito.mock(ClaimRepository.class);
        SupportContextBuilder builder = new SupportContextBuilder();
        ReflectionTestUtils.setField(builder, "surplusPostRepository", surplusPostRepository);
        ReflectionTestUtils.setField(builder, "claimRepository", claimRepository);

        User receiver = new User();
        receiver.setId(10L);
        receiver.setEmail("receiver@test.com");
        receiver.setRole(UserRole.RECEIVER);
        receiver.setLanguagePreference(null);
        receiver.setAccountStatus(AccountStatus.ACTIVE);

        Organization org = new Organization();
        org.setName("Helping Hands");
        org.setOrganizationType(OrganizationType.CHARITY);
        org.setVerificationStatus(VerificationStatus.VERIFIED);
        receiver.setOrganization(org);

        User donor = new User();
        donor.setId(99L);
        donor.setEmail("donor@test.com");
        donor.setRole(UserRole.DONOR);

        SurplusPost donation = new SurplusPost();
        donation.setId(1L);
        donation.setDonor(donor);
        donation.setStatus(PostStatus.CLAIMED);
        donation.setPickupFrom(LocalTime.of(9, 0));
        donation.setPickupTo(LocalTime.of(11, 0));

        Claim claim = new Claim();
        claim.setId(2L);
        claim.setReceiver(receiver);
        claim.setSurplusPost(donation);
        claim.setStatus(ClaimStatus.ACTIVE);
        claim.setConfirmedPickupStartTime(LocalTime.of(10, 0));
        claim.setConfirmedPickupEndTime(LocalTime.of(11, 0));

        when(surplusPostRepository.findById(1L)).thenReturn(Optional.of(donation));
        when(claimRepository.findById(2L)).thenReturn(Optional.of(claim));

        SupportChatRequest.PageContext pageContext = new SupportChatRequest.PageContext();
        pageContext.setRoute("/receiver/browse");
        pageContext.setDonationId("1");
        pageContext.setClaimId("2");
        SupportChatRequest request = new SupportChatRequest("help", pageContext);

        JsonNode context = builder.buildSupportContext(receiver, request);

        assertThat(context.get("user").get("id").asLong()).isEqualTo(10L);
        assertThat(context.get("user").get("languagePreference").asText()).isEqualTo("en");
        assertThat(context.get("organization").get("name").asText()).isEqualTo("Helping Hands");

        JsonNode donationNode = context.get("pageContext").get("donation");
        assertThat(donationNode.get("id").asLong()).isEqualTo(1L);
        assertThat(donationNode.get("status").asText()).isEqualTo("CLAIMED");
        assertThat(donationNode.has("pickupWindowStart")).isFalse();

        JsonNode claimNode = context.get("pageContext").get("claim");
        assertThat(claimNode.get("id").asLong()).isEqualTo(2L);
        assertThat(claimNode.get("pickupCodeVisible").asBoolean()).isFalse();
    }

    @Test
    void buildSupportContext_invalidDonationId_skipsDonation() {
        SupportContextBuilder builder = new SupportContextBuilder();
        ReflectionTestUtils.setField(builder, "surplusPostRepository", Mockito.mock(SurplusPostRepository.class));
        ReflectionTestUtils.setField(builder, "claimRepository", Mockito.mock(ClaimRepository.class));

        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setRole(UserRole.RECEIVER);
        user.setAccountStatus(AccountStatus.ACTIVE);

        SupportChatRequest.PageContext pageContext = new SupportChatRequest.PageContext();
        pageContext.setRoute("/receiver/browse");
        pageContext.setDonationId("not-a-number");
        SupportChatRequest request = new SupportChatRequest("help", pageContext);

        JsonNode context = builder.buildSupportContext(user, request);

        assertThat(context.get("pageContext").has("donation")).isFalse();
    }
}
