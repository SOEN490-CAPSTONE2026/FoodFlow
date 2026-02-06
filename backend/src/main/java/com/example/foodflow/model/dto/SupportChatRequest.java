package com.example.foodflow.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for the support chat endpoint.
 * Contains the user's message and optional page context for better assistance.
 */
public class SupportChatRequest {

    @NotBlank(message = "Message cannot be blank")
    private String message;

    @JsonProperty("pageContext")
    private PageContext pageContext;

    // Constructors
    public SupportChatRequest() {
    }

    public SupportChatRequest(String message, PageContext pageContext) {
        this.message = message;
        this.pageContext = pageContext;
    }

    // Getters and setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public PageContext getPageContext() {
        return pageContext;
    }

    public void setPageContext(PageContext pageContext) {
        this.pageContext = pageContext;
    }

    /**
     * Page context information to provide better contextual assistance
     */
    public static class PageContext {
        private String route;
        private String donationId;
        private String claimId;

        // Constructors
        public PageContext() {
        }

        public PageContext(String route, String donationId, String claimId) {
            this.route = route;
            this.donationId = donationId;
            this.claimId = claimId;
        }

        // Getters and setters
        public String getRoute() {
            return route;
        }

        public void setRoute(String route) {
            this.route = route;
        }

        public String getDonationId() {
            return donationId;
        }

        public void setDonationId(String donationId) {
            this.donationId = donationId;
        }

        public String getClaimId() {
            return claimId;
        }

        public void setClaimId(String claimId) {
            this.claimId = claimId;
        }
    }
}