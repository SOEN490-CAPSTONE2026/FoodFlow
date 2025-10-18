package com.example.foodflow.controller;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {
    
    private final MessageService messageService;
    
    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }
    
    // Send message via REST (alternative to WebSocket)
    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody MessageRequest request,
            @AuthenticationPrincipal User sender) {
        MessageResponse response = messageService.sendMessage(request, sender);
        return ResponseEntity.ok(response);
    }
    
    // Get all messages for a specific surplus post
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<MessageResponse>> getMessagesForPost(
            @PathVariable Long postId) {
        List<MessageResponse> messages = messageService.getMessagesForPost(postId);
        return ResponseEntity.ok(messages);
    }
    
    // Get messages between two users for a specific post
    @GetMapping("/conversation")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @RequestParam Long postId,
            @RequestParam Long otherUserId,
            @AuthenticationPrincipal User currentUser) {
        List<MessageResponse> messages = messageService.getMessagesBetweenUsers(
            postId, currentUser.getId(), otherUserId);
        return ResponseEntity.ok(messages);
    }
    
    // Mark message as read
    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.markAsRead(messageId, currentUser);
        return ResponseEntity.ok().build();
    }
    
    // Get unread message count
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        long count = messageService.getUnreadCount(currentUser);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
