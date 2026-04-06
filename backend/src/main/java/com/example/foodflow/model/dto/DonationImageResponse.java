package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import java.time.LocalDateTime;
public class DonationImageResponse {
    private Long id;
    private Long donorId;
    private String donorName;
    private String donorEmail;
    private Long donationId;
    private FoodType foodType;
    private String url;
    private DonationImageStatus status;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private Long moderatedBy;
    private LocalDateTime moderatedAt;
    private String reason;
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getDonorId() {
        return donorId;
    }
    public void setDonorId(Long donorId) {
        this.donorId = donorId;
    }
    public String getDonorName() {
        return donorName;
    }
    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }
    public String getDonorEmail() {
        return donorEmail;
    }
    public void setDonorEmail(String donorEmail) {
        this.donorEmail = donorEmail;
    }
    public Long getDonationId() {
        return donationId;
    }
    public void setDonationId(Long donationId) {
        this.donationId = donationId;
    }
    public FoodType getFoodType() {
        return foodType;
    }
    public void setFoodType(FoodType foodType) {
        this.foodType = foodType;
    }
    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public DonationImageStatus getStatus() {
        return status;
    }
    public void setStatus(DonationImageStatus status) {
        this.status = status;
    }
    public String getOriginalFileName() {
        return originalFileName;
    }
    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }
    public String getContentType() {
        return contentType;
    }
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    public Long getFileSize() {
        return fileSize;
    }
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public Long getModeratedBy() {
        return moderatedBy;
    }
    public void setModeratedBy(Long moderatedBy) {
        this.moderatedBy = moderatedBy;
    }
    public LocalDateTime getModeratedAt() {
        return moderatedAt;
    }
    public void setModeratedAt(LocalDateTime moderatedAt) {
        this.moderatedAt = moderatedAt;
    }
    public String getReason() {
        return reason;
    }
    public void setReason(String reason) {
        this.reason = reason;
    }
}
