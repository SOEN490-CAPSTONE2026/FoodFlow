package com.example.foodflow.model.dto;

/**
 * Response DTO for upload evidence operations.
 */
public class UploadEvidenceResponse {

    private String url;
    private String message;
    private boolean success;

    public UploadEvidenceResponse() {}

    public UploadEvidenceResponse(String url, String message, boolean success) {
        this.url = url;
        this.message = message;
        this.success = success;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}

