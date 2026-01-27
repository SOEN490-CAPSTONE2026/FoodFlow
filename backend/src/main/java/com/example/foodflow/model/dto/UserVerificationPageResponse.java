package com.example.foodflow.model.dto;

import java.util.List;

public class UserVerificationPageResponse {
    private List<UserVerificationDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;

    public UserVerificationPageResponse() {}

    public UserVerificationPageResponse(List<UserVerificationDTO> content, long totalElements, int totalPages, int currentPage) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
    }

    // Getters and setters
    public List<UserVerificationDTO> getContent() { return content; }
    public void setContent(List<UserVerificationDTO> content) { this.content = content; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }
}
