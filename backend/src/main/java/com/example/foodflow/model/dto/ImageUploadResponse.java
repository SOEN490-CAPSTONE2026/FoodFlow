package com.example.foodflow.model.dto;
public class ImageUploadResponse {
    private String message;
    private DonationImageResponse image;
    public ImageUploadResponse() {
    }
    public ImageUploadResponse(String message, DonationImageResponse image) {
        this.message = message;
        this.image = image;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public DonationImageResponse getImage() {
        return image;
    }
    public void setImage(DonationImageResponse image) {
        this.image = image;
    }
}
