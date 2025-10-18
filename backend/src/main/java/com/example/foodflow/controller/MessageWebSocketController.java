package com.example.foodflow.controller;

import com.example.foodflow.model.dto.MessageRequest;
import com.example.foodflow.model.dto.MessageResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

@Controller
public class MessageWebSocketController {
    
    private final MessageService messageService;
    
    public MessageWebSocketController(MessageService messageService) {
        this.messageService = messageService;
    }
    
    @MessageMapping("/messages/send")
    public MessageResponse sendMessage(
            @Payload MessageRequest request,
            @AuthenticationPrincipal User sender) {
        return messageService.sendMessage(request, sender);
    }
}
