package com.example.foodflow.controller;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * Send message via REST (alternative to WebSocket)
     */
    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User sender) {
        MessageResponse response = messageService.sendMessage(request, sender);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Mark a specific message as read
     */
    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.markAsRead(messageId, currentUser);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get unread message count for current user
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        long count = messageService.getUnreadCount(currentUser);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
