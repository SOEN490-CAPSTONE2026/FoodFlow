package com.example.foodflow.controller;

import com.example.foodflow.model.dto.DonorPrivacySettingsDTO;
import com.example.foodflow.service.DonationStatsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DonationControllerTest {

    @Mock
    private DonationStatsService donationStatsService;

    @InjectMocks
    private DonationController donationController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(donationController)
                .setMessageConverters(converter)
                .build();
    }

    // ==================== Tests for getPlatformDonationStats ====================

    @Test
    void testGetPlatformDonationStats_Success() throws Exception {
        Map<String, Object> totals = new HashMap<>();
        totals.put("totalAmountDonated", new BigDecimal("5000"));
        totals.put("totalDonationCount", 42L);
        totals.put("totalDonorCount", 15L);
        totals.put("currency", "CAD");

        when(donationStatsService.getPlatformTotals()).thenReturn(totals);

        mockMvc.perform(get("/api/donations/stats/platform"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmountDonated").value(5000))
                .andExpect(jsonPath("$.totalDonationCount").value(42))
                .andExpect(jsonPath("$.totalDonorCount").value(15))
                .andExpect(jsonPath("$.currency").value("CAD"));
    }

    // ==================== Tests for getUserBadge ====================

    @Test
    void testGetUserBadge_Success() throws Exception {
        Map<String, Object> badgeInfo = new HashMap<>();
        badgeInfo.put("currentBadge", "SILVER");
        badgeInfo.put("badgeDescription", "Silver tier donor");
        badgeInfo.put("nextBadge", "GOLD");
        badgeInfo.put("progressPercent", 60.0);
        badgeInfo.put("currency", "CAD");

        when(donationStatsService.getUserBadgeInfo(1L)).thenReturn(badgeInfo);

        mockMvc.perform(get("/api/donations/badge/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentBadge").value("SILVER"))
                .andExpect(jsonPath("$.nextBadge").value("GOLD"))
                .andExpect(jsonPath("$.progressPercent").value(60.0));
    }

    // ==================== Tests for getPrivacySettings ====================

    @Test
    void testGetPrivacySettings_Success() throws Exception {
        DonorPrivacySettingsDTO settings = new DonorPrivacySettingsDTO(true, false, true, false);
        when(donationStatsService.getPrivacySettings(1L)).thenReturn(settings);

        mockMvc.perform(get("/api/donations/privacy/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.showBadgePublicly").value(true))
                .andExpect(jsonPath("$.showDonationHistory").value(false))
                .andExpect(jsonPath("$.showOnLeaderboard").value(true))
                .andExpect(jsonPath("$.anonymousByDefault").value(false));
    }

    // ==================== Tests for updatePrivacySettings ====================

    @Test
    void testUpdatePrivacySettings_Success() throws Exception {
        DonorPrivacySettingsDTO input = new DonorPrivacySettingsDTO(false, true, false, true);
        DonorPrivacySettingsDTO updated = new DonorPrivacySettingsDTO(false, true, false, true);

        when(donationStatsService.updatePrivacySettings(eq(1L), any(DonorPrivacySettingsDTO.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/donations/privacy/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.showBadgePublicly").value(false))
                .andExpect(jsonPath("$.showDonationHistory").value(true))
                .andExpect(jsonPath("$.showOnLeaderboard").value(false))
                .andExpect(jsonPath("$.anonymousByDefault").value(true));

        verify(donationStatsService).updatePrivacySettings(eq(1L), any(DonorPrivacySettingsDTO.class));
    }

    @Test
    void testUpdatePrivacySettings_PartialUpdate() throws Exception {
        String partialJson = "{\"anonymousByDefault\": true}";
        DonorPrivacySettingsDTO updated = new DonorPrivacySettingsDTO(true, false, true, true);

        when(donationStatsService.updatePrivacySettings(eq(1L), any(DonorPrivacySettingsDTO.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/donations/privacy/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(partialJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anonymousByDefault").value(true))
                .andExpect(jsonPath("$.showBadgePublicly").value(true));
    }

    // ==================== Tests for getPublicDonorProfile ====================

    @Test
    void testGetPublicDonorProfile_AllVisible() throws Exception {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", 1L);
        profile.put("badge", "GOLD");
        profile.put("badgeDescription", "Gold tier donor");
        profile.put("totalDonated", new BigDecimal("150"));
        profile.put("donationCount", 8);
        profile.put("showOnLeaderboard", true);

        when(donationStatsService.getPublicDonorProfile(1L)).thenReturn(profile);

        mockMvc.perform(get("/api/donations/profile/1/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.badge").value("GOLD"))
                .andExpect(jsonPath("$.totalDonated").value(150))
                .andExpect(jsonPath("$.donationCount").value(8))
                .andExpect(jsonPath("$.showOnLeaderboard").value(true));
    }

    @Test
    void testGetPublicDonorProfile_HiddenFields() throws Exception {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", 1L);
        profile.put("badge", null);
        profile.put("badgeDescription", null);
        profile.put("totalDonated", null);
        profile.put("donationCount", null);
        profile.put("lastDonationDate", null);
        profile.put("showOnLeaderboard", false);

        when(donationStatsService.getPublicDonorProfile(1L)).thenReturn(profile);

        mockMvc.perform(get("/api/donations/profile/1/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.badge").doesNotExist())
                .andExpect(jsonPath("$.totalDonated").doesNotExist())
                .andExpect(jsonPath("$.showOnLeaderboard").value(false));
    }

    // ==================== Tests for getDetailedPlatformMetrics ====================

    @Test
    void testGetDetailedPlatformMetrics_Success() throws Exception {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalAmountDonated", new BigDecimal("10000"));
        metrics.put("totalDonationCount", 100L);
        metrics.put("averageDonationAmount", new BigDecimal("100"));
        metrics.put("currency", "CAD");

        when(donationStatsService.getPlatformMetricsFromView()).thenReturn(metrics);

        mockMvc.perform(get("/api/donations/stats/platform/detailed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmountDonated").value(10000))
                .andExpect(jsonPath("$.totalDonationCount").value(100))
                .andExpect(jsonPath("$.averageDonationAmount").value(100));
    }
}
