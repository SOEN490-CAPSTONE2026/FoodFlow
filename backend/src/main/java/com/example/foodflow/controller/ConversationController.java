package com.example.foodflow.controller;

import com.example.foodflow.model.dto.StartPostConversationRequest;
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
    
    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }
    
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
        ConversationResponse conversation = conversationService.startConversation(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }
    
    /**
     * Get a specific conversation
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ConversationResponse conversation = conversationService.getConversationResponse(id, currentUser);
        return ResponseEntity.ok(conversation);
    }
    
    /**
     * Get all messages in a conversation
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        List<MessageResponse> messages = messageService.getConversationMessages(id, currentUser);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Mark all messages in a conversation as read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markConversationAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        messageService.markConversationAsRead(id, currentUser);
        return ResponseEntity.ok().build();
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
        ConversationResponse conversation = conversationService.getConversationByPost(postId, currentUser);
        return ResponseEntity.ok(conversation);
    }

    /**
     * Create or get conversation for a specific post
     * Creates a new conversation linked to the post if one doesn't exist
     * Returns existing conversation if it already exists
     */
    @PostMapping("/post/{postId}")
    public ResponseEntity<ConversationResponse> createOrGetPostConversation(
            @PathVariable Long postId,
            @Valid @RequestBody StartPostConversationRequest request,
            @AuthenticationPrincipal User currentUser) {
        ConversationResponse conversation = conversationService.createOrGetPostConversation(
            postId, request.getOtherUserId(), currentUser
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }

    /**
     * Express interest in a donation - creates/returns a donation-anchored conversation thread.
     * No request body needed - receiver is the authenticated user, donor comes from the post.
     */
    @PostMapping("/interested/{postId}")
    public ResponseEntity<ConversationResponse> expressInterest(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        ConversationResponse conversation = conversationService.expressInterestInDonation(postId, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }
}
