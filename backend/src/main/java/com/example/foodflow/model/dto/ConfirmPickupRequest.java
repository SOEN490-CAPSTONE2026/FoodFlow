package com.example.foodflow.model.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public class ConfirmPickupRequest {

    @NotNull
    private long postId;

    @NotBlank
    private String otpCode;

    // Getters and setters
   public Long getPostId() {
    return postId;
}


    public void setPostId(long postId) {
        this.postId = postId;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }
}

