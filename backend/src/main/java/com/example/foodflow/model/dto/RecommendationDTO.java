package com.example.foodflow.model.dto;

import java.util.List;

/**
 * DTO for recommendation data response
 */
public class RecommendationDTO {
    private Long postId;
    private Integer score;
    private List<String> reasons;
    private Boolean isRecommended;

    public RecommendationDTO() {}

    public RecommendationDTO(Long postId, Integer score, List<String> reasons) {
        this.postId = postId;
        this.score = score;
        this.reasons = reasons;
        this.isRecommended = score != null && score > 0;
    }

    // Getters and Setters
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) { this.reasons = reasons; }

    public Boolean getIsRecommended() { return isRecommended; }
    public void setIsRecommended(Boolean isRecommended) { this.isRecommended = isRecommended; }

    @Override
    public String toString() {
        return String.format("RecommendationDTO{postId=%d, score=%d, reasons=%s}", 
                           postId, score, reasons);
    }
}