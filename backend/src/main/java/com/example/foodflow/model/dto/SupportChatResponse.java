package com.example.foodflow.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Response DTO for the support chat endpoint.
 * Contains the assistant's reply, detected intent, suggested actions, and
 * escalation flag.
 */
public class SupportChatResponse {

    private String reply;
    private String intent;
    private List<SupportAction> actions;
    private boolean escalate;

    // Constructors
    public SupportChatResponse() {
    }

    public SupportChatResponse(String reply, String intent, List<SupportAction> actions, boolean escalate) {
        this.reply = reply;
        this.intent = intent;
        this.actions = actions;
        this.escalate = escalate;
    }

    // Getters and setters
    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public List<SupportAction> getActions() {
        return actions;
    }

    public void setActions(List<SupportAction> actions) {
        this.actions = actions;
    }

    public boolean isEscalate() {
        return escalate;
    }

    public void setEscalate(boolean escalate) {
        this.escalate = escalate;
    }

    /**
     * Represents a suggested action that the user can take
     */
    public static class SupportAction {
        private String type; // "link", "copy", "contact"
        private String label;
        private String value;

        // Constructors
        public SupportAction() {
        }

        public SupportAction(String type, String label, String value) {
            this.type = type;
            this.label = label;
            this.value = value;
        }

        // Getters and setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }
    }
}