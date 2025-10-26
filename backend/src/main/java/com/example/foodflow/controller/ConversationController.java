package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ConversationResponse;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.dto.StartConversationRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.ConversationService;
import com.example.foodflow.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {
    
    @Autowired
    private ConversationService conversationService;
    
    @Autowired
    private MessageService messageService;
    
    /**
     * Get all conversations for the current user
     */
    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getUserConversations(
            @AuthenticationPrincipal User currentUser) {
        List<ConversationResponse> conversations = conversationService.getUserConversations(currentUser);
        return ResponseEntity.ok(conversations);
    }
    
    /**
     * Start a new conversation with a user by email
     */
    @PostMapping
    public ResponseEntity<ConversationResponse> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            ConversationResponse conversation = conversationService.startConversation(currentUser, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get a specific conversation
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            ConversationResponse conversation = conversationService.getConversationResponse(id, currentUser);
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    /**
     * Get all messages in a conversation
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            List<MessageResponse> messages = messageService.getConversationMessages(id, currentUser);
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    /**
     * Mark all messages in a conversation as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        try {
            messageService.markConversationAsRead(id, currentUser);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    /**
     * Get conversation for a specific post
     * Returns the conversation details including the other participant
     * for the current user and the specified post
     */
    @GetMapping("/post/{postId}")
    public ResponseEntity<ConversationResponse> getConversationByPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        try {
            ConversationResponse conversation = conversationService.getConversationByPost(postId, currentUser);
            return ResponseEntity.ok(conversation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
