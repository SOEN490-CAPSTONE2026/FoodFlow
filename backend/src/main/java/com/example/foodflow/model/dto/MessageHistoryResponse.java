package com.example.foodflow.model.dto;

import java.util.List;

/**
 * DTO for paginated message history response
 */
public class MessageHistoryResponse {
    
    private List<MessageResponse> messages;
    private int currentPage;
    private int totalPages;
    private long totalMessages;
    private boolean hasMore;
    
    public MessageHistoryResponse() {}
    
    public MessageHistoryResponse(List<MessageResponse> messages, int currentPage, 
                                   int totalPages, long totalMessages, boolean hasMore) {
        this.messages = messages;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalMessages = totalMessages;
        this.hasMore = hasMore;
    }
    
    // Getters and Setters
    public List<MessageResponse> getMessages() {
        return messages;
    }
    
    public void setMessages(List<MessageResponse> messages) {
        this.messages = messages;
    }
    
    public int getCurrentPage() {
        return currentPage;
    }
    
    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
    
    public long getTotalMessages() {
        return totalMessages;
    }
    
    public void setTotalMessages(long totalMessages) {
        this.totalMessages = totalMessages;
    }
    
    public boolean isHasMore() {
        return hasMore;
    }
    
    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }
}