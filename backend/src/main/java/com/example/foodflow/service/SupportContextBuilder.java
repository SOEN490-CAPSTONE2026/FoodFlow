package com.example.foodflow.service;

import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.Claim;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.repository.SurplusPostRepository;
import com.example.foodflow.repository.ClaimRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for building RBAC-safe context information for support requests.
 * Ensures only appropriate data is included based on user role and permissions.
 */
@Service
public class SupportContextBuilder {

    @Autowired
    private SurplusPostRepository surplusPostRepository;

    @Autowired
    private ClaimRepository claimRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Build support context for the authenticated user
     * 
     * @param user    Authenticated user
     * @param request Support chat request with optional page context
     * @return JSON object containing RBAC-safe context information
     */
    public JsonNode buildSupportContext(User user, SupportChatRequest request) {
        ObjectNode context = objectMapper.createObjectNode();

        // Add basic user information (always safe)
        ObjectNode userInfo = objectMapper.createObjectNode();
        userInfo.put("id", user.getId());
        userInfo.put("role", user.getRole().toString());
        userInfo.put("languagePreference", user.getLanguagePreference() != null ? user.getLanguagePreference() : "en");
        userInfo.put("accountStatus", user.getAccountStatus().toString());

        // Add verification status if user has organization (receivers)
        if (user.getOrganization() != null) {
            Organization org = user.getOrganization();
            userInfo.put("verificationStatus",
                    org.getVerificationStatus() != null ? org.getVerificationStatus().toString() : "UNKNOWN");
        }

        context.set("user", userInfo);

        // Add organization info if applicable (RBAC-safe fields only)
        if (user.getOrganization() != null) {
            ObjectNode orgInfo = objectMapper.createObjectNode();
            orgInfo.put("name", user.getOrganization().getName());
            orgInfo.put("type", user.getOrganization().getOrganizationType().toString());
            // Note: We do NOT include address, contact details, or internal notes
            context.set("organization", orgInfo);
        }

        // Add notification settings (always safe for own account)
        ObjectNode notificationSettings = objectMapper.createObjectNode();
        notificationSettings.put("emailEnabled",
                user.getEmailNotificationsEnabled() != null ? user.getEmailNotificationsEnabled() : false);
        notificationSettings.put("smsEnabled",
                user.getSmsNotificationsEnabled() != null ? user.getSmsNotificationsEnabled() : false);
        context.set("notificationSettings", notificationSettings);

        // Add page context
        if (request.getPageContext() != null) {
            ObjectNode pageContext = objectMapper.createObjectNode();
            pageContext.put("route", request.getPageContext().getRoute());

            // Add donation context if applicable and user has access
            if (request.getPageContext().getDonationId() != null) {
                addDonationContext(pageContext, request.getPageContext().getDonationId(), user);
            }

            // Add claim context if applicable and user has access
            if (request.getPageContext().getClaimId() != null) {
                addClaimContext(pageContext, request.getPageContext().getClaimId(), user);
            }

            context.set("pageContext", pageContext);
        }

        return context;
    }

    /**
     * Add donation context with RBAC checks
     */
    private void addDonationContext(ObjectNode pageContext, String donationIdStr, User user) {
        try {
            Long donationId = Long.parseLong(donationIdStr);
            Optional<SurplusPost> donationOpt = surplusPostRepository.findById(donationId);

            if (donationOpt.isPresent()) {
                SurplusPost donation = donationOpt.get();

                // RBAC check: user must be the donor, admin, or the donation must be public
                boolean hasAccess = donation.getDonor().getId().equals(user.getId()) ||
                        "ADMIN".equals(user.getRole().toString()) ||
                        isPublicDonationInfo(donation);

                if (hasAccess) {
                    ObjectNode donationInfo = objectMapper.createObjectNode();
                    donationInfo.put("id", donation.getId());
                    donationInfo.put("status", donation.getStatus().toString());

                    // Only include sensitive timing info for donor/admin
                    if (donation.getDonor().getId().equals(user.getId()) || "ADMIN".equals(user.getRole().toString())) {
                        if (donation.getPickupFrom() != null) {
                            donationInfo.put("pickupWindowStart", donation.getPickupFrom().toString());
                        }
                        if (donation.getPickupTo() != null) {
                            donationInfo.put("pickupWindowEnd", donation.getPickupTo().toString());
                        }
                        donationInfo.put("lastUpdatedAt", donation.getUpdatedAt().toString());
                    }

                    // Note: We do NOT include: pickup location, donor contact info, pickup codes
                    pageContext.set("donation", donationInfo);
                }
            }
        } catch (NumberFormatException e) {
            // Invalid donation ID format, skip context
        } catch (Exception e) {
            // Any other error, skip context for security
        }
    }

    /**
     * Add claim context with RBAC checks
     */
    private void addClaimContext(ObjectNode pageContext, String claimIdStr, User user) {
        try {
            Long claimId = Long.parseLong(claimIdStr);
            Optional<Claim> claimOpt = claimRepository.findById(claimId);

            if (claimOpt.isPresent()) {
                Claim claim = claimOpt.get();

                // RBAC check: user must be the claimer, the donor, or admin
                boolean hasAccess = claim.getReceiver().getId().equals(user.getId()) ||
                        claim.getSurplusPost().getDonor().getId().equals(user.getId()) ||
                        "ADMIN".equals(user.getRole().toString());

                if (hasAccess) {
                    ObjectNode claimInfo = objectMapper.createObjectNode();
                    claimInfo.put("id", claim.getId());
                    claimInfo.put("status", claim.getStatus().toString());

                    // Pickup window info (safe for both parties)
                    if (claim.getConfirmedPickupStartTime() != null) {
                        claimInfo.put("pickupWindowStart", claim.getConfirmedPickupStartTime().toString());
                    }
                    if (claim.getConfirmedPickupEndTime() != null) {
                        claimInfo.put("pickupWindowEnd", claim.getConfirmedPickupEndTime().toString());
                    }

                    // Only indicate if pickup code is visible to this user (business rule
                    // dependent)
                    boolean pickupCodeVisible = claim.getReceiver().getId().equals(user.getId()) &&
                            "CONFIRMED".equals(claim.getStatus().toString());
                    claimInfo.put("pickupCodeVisible", pickupCodeVisible);

                    // Note: We do NOT include the actual pickup code, location details, or other
                    // party's contact info
                    pageContext.set("claim", claimInfo);
                }
            }
        } catch (NumberFormatException e) {
            // Invalid claim ID format, skip context
        } catch (Exception e) {
            // Any other error, skip context for security
        }
    }

    /**
     * Determine if donation information is considered public
     */
    private boolean isPublicDonationInfo(SurplusPost donation) {
        // For now, only basic status info is considered public for active donations
        // This could be expanded based on business rules
        return "ACTIVE".equals(donation.getStatus().toString()) ||
                "CLAIMED".equals(donation.getStatus().toString());
    }
}