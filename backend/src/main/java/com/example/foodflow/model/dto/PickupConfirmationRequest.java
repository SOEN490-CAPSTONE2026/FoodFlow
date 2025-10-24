package com.example.foodflow.model.dto;

public class PickupConfirmationRequest {
     private Long postId;
    private String otp;

    public PickupConfirmationRequest() {}

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
