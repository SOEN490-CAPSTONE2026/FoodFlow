package com.example.foodflow.controller;
import com.example.foodflow.model.dto.ReferralRequest;
import com.example.foodflow.model.dto.ReferralResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.model.types.ReferralType;
import com.example.foodflow.service.ReferralService;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReferralControllerTest {
        @Autowired
        private MockMvc mockMvc;
        @Autowired
        private ObjectMapper objectMapper;
        @MockBean
        private ReferralService referralService;
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
                                donorUser, null,
                                Collections.singletonList(new SimpleGrantedAuthority("DONOR")));
                receiverAuth = new UsernamePasswordAuthenticationToken(
                                receiverUser, null,
                                Collections.singletonList(new SimpleGrantedAuthority("RECEIVER")));
                adminAuth = new UsernamePasswordAuthenticationToken(
                                adminUser, null,
                                Collections.singletonList(new SimpleGrantedAuthority("ADMIN")));
        }
        // ─── POST /api/referrals ───────────────────────────────────────────────────
        @Test
        void submitReferral_AsDonor_ShouldReturn201() throws Exception {
                ReferralRequest request = buildValidSuggestBusinessRequest();
                ReferralResponse response = buildReferralResponse(1L, ReferralType.SUGGEST_BUSINESS,
                                "Green Valley Bakery", "contact@bakery.com", "donor@example.com");
                when(referralService.submitReferral(any(ReferralRequest.class), anyLong()))
                                .thenReturn(response);
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(1))
                                .andExpect(jsonPath("$.referralType").value("SUGGEST_BUSINESS"))
                                .andExpect(jsonPath("$.businessName").value("Green Valley Bakery"))
                                .andExpect(jsonPath("$.submittedByEmail").value("donor@example.com"));
        }
        @Test
        void submitReferral_AsReceiver_ShouldReturn201() throws Exception {
                ReferralRequest request = buildValidInviteCommunityRequest();
                ReferralResponse response = buildReferralResponse(2L, ReferralType.INVITE_COMMUNITY,
                                "Community Food Pantry", "info@pantry.org", "receiver@example.com");
                when(referralService.submitReferral(any(ReferralRequest.class), anyLong()))
                                .thenReturn(response);
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(receiverAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(2))
                                .andExpect(jsonPath("$.referralType").value("INVITE_COMMUNITY"))
                                .andExpect(jsonPath("$.businessName").value("Community Food Pantry"));
        }
        @Test
        void submitReferral_MissingBusinessName_ShouldReturn400() throws Exception {
                ReferralRequest request = new ReferralRequest();
                request.setReferralType(ReferralType.SUGGEST_BUSINESS);
                // missing businessName
                request.setContactEmail("valid@email.com");
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
        @Test
        void submitReferral_InvalidContactEmail_ShouldReturn400() throws Exception {
                ReferralRequest request = new ReferralRequest();
                request.setReferralType(ReferralType.SUGGEST_BUSINESS);
                request.setBusinessName("Some Business");
                request.setContactEmail("not-an-email");
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
        @Test
        void submitReferral_MissingReferralType_ShouldReturn400() throws Exception {
                ReferralRequest request = new ReferralRequest();
                // missing referralType
                request.setBusinessName("Some Business");
                request.setContactEmail("contact@business.com");
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
        @Test
        void submitReferral_ServiceThrowsException_ShouldReturn400() throws Exception {
                ReferralRequest request = buildValidSuggestBusinessRequest();
                when(referralService.submitReferral(any(ReferralRequest.class), anyLong()))
                                .thenThrow(new RuntimeException("Submitter not found"));
                mockMvc.perform(post("/api/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest());
        }
        // ─── GET /api/admin/referrals ─────────────────────────────────────────────
        @Test
        void getAllReferrals_AsAdmin_ShouldReturn200() throws Exception {
                List<ReferralResponse> referralList = Arrays.asList(
                                buildReferralResponse(1L, ReferralType.SUGGEST_BUSINESS,
                                                "Green Valley Bakery", "contact@bakery.com", "donor@example.com"),
                                buildReferralResponse(2L, ReferralType.INVITE_COMMUNITY,
                                                "Community Food Pantry", "info@pantry.org", "receiver@example.com"));
                when(referralService.getAllReferrals()).thenReturn(referralList);
                mockMvc.perform(get("/api/admin/referrals")
                                .with(authentication(adminAuth))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].referralType").value("SUGGEST_BUSINESS"))
                                .andExpect(jsonPath("$[1].referralType").value("INVITE_COMMUNITY"));
        }
        @Test
        void getAllReferrals_AsNonAdmin_ShouldReturn403() throws Exception {
                mockMvc.perform(get("/api/admin/referrals")
                                .with(authentication(donorAuth))
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isForbidden());
        }
        @Test
        void getAllReferrals_Unauthenticated_ShouldReturn401() throws Exception {
                mockMvc.perform(get("/api/admin/referrals")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isUnauthorized());
        }
        // ─── Helpers ──────────────────────────────────────────────────────────────
        private ReferralRequest buildValidSuggestBusinessRequest() {
                ReferralRequest r = new ReferralRequest();
                r.setReferralType(ReferralType.SUGGEST_BUSINESS);
                r.setBusinessName("Green Valley Bakery");
                r.setContactEmail("contact@bakery.com");
                r.setContactPhone("+1 555-123-4567");
                r.setMessage("They have lots of surplus bread at end of day.");
                return r;
        }
        private ReferralRequest buildValidInviteCommunityRequest() {
                ReferralRequest r = new ReferralRequest();
                r.setReferralType(ReferralType.INVITE_COMMUNITY);
                r.setBusinessName("Community Food Pantry");
                r.setContactEmail("info@pantry.org");
                r.setMessage("They need food donations urgently.");
                return r;
        }
        private ReferralResponse buildReferralResponse(Long id, ReferralType type,
                        String name, String email, String submitter) {
                ReferralResponse r = new ReferralResponse();
                r.setId(id);
                r.setReferralType(type);
                r.setBusinessName(name);
                r.setContactEmail(email);
                r.setSubmittedByEmail(submitter);
                r.setCreatedAt(LocalDateTime.now());
                return r;
        }
}
