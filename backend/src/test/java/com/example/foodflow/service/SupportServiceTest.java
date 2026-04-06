package com.example.foodflow.service;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyMap;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
class SupportServiceTest {
    @Test
    void processChat_happyPath_convertsActionsAndDefaultsEscalate() {
        ContextualSupportService contextualSupportService = Mockito.mock(ContextualSupportService.class);
        SupportContextBuilder contextBuilder = Mockito.mock(SupportContextBuilder.class);
        ConversationService conversationService = Mockito.mock(ConversationService.class);
        MessageService messageService = Mockito.mock(MessageService.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        SupportService service = new SupportService(
            contextualSupportService,
            contextBuilder,
            conversationService,
            messageService,
            userRepository
        );
        when(contextBuilder.buildSupportContext(any(User.class), any(SupportChatRequest.class)))
            .thenReturn(new ObjectMapper().createObjectNode());
        Map<String, Object> aiResult = new java.util.HashMap<>();
        aiResult.put("reply", "Here is a response");
        aiResult.put("actions", List.of(
            Map.of("type", "link", "label", "Help Center", "value", "/help")
        ));
        when(contextualSupportService.generateResponse(anyString(), anyString(), anyString(), anyMap()))
            .thenReturn(aiResult);
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setRole(UserRole.RECEIVER);
        user.setLanguagePreference("en");
        SupportChatRequest request = new SupportChatRequest();
        request.setMessage("Help");
        SupportChatResponse response = service.processChat(request, user);
        assertThat(response.getReply()).isEqualTo("Here is a response");
        assertThat(response.getIntent()).isEqualTo("AI_RESPONSE");
        assertThat(response.getActions()).hasSize(1);
        assertThat(response.getActions().get(0).getType()).isEqualTo("link");
        assertThat(response.isEscalate()).isFalse();
    }
    @Test
    void processChat_whenException_returnsLocalizedError() {
        ContextualSupportService contextualSupportService = Mockito.mock(ContextualSupportService.class);
        SupportContextBuilder contextBuilder = Mockito.mock(SupportContextBuilder.class);
        ConversationService conversationService = Mockito.mock(ConversationService.class);
        MessageService messageService = Mockito.mock(MessageService.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        SupportService service = new SupportService(
            contextualSupportService,
            contextBuilder,
            conversationService,
            messageService,
            userRepository
        );
        ReflectionTestUtils.setField(service, "supportEmail", "help@foodflow.test");
        when(contextBuilder.buildSupportContext(any(User.class), any(SupportChatRequest.class)))
            .thenReturn(new ObjectMapper().createObjectNode());
        doThrow(new RuntimeException("boom"))
            .when(contextualSupportService)
            .generateResponse(anyString(), anyString(), anyString(), anyMap());
        User user = new User();
        user.setId(2L);
        user.setEmail("user@test.com");
        user.setRole(UserRole.RECEIVER);
        user.setLanguagePreference("fr");
        SupportChatRequest request = new SupportChatRequest();
        request.setMessage("Aide");
        SupportChatResponse response = service.processChat(request, user);
        assertThat(response.getIntent()).isEqualTo("ERROR");
        assertThat(response.isEscalate()).isTrue();
        assertThat(response.getReply()).contains("Désolé");
        assertThat(response.getActions()).isNotEmpty();
        assertThat(response.getActions().get(0).getValue()).isEqualTo("help@foodflow.test");
    }
    @Test
    void processChat_whenUserInsistsOnHumanSupport_opensMessagesConversation() {
        ContextualSupportService contextualSupportService = Mockito.mock(ContextualSupportService.class);
        SupportContextBuilder contextBuilder = Mockito.mock(SupportContextBuilder.class);
        ConversationService conversationService = Mockito.mock(ConversationService.class);
        MessageService messageService = Mockito.mock(MessageService.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        SupportService service = new SupportService(
            contextualSupportService,
            contextBuilder,
            conversationService,
            messageService,
            userRepository
        );
        when(contextBuilder.buildSupportContext(any(User.class), any(SupportChatRequest.class)))
            .thenReturn(new ObjectMapper().createObjectNode());
        when(contextualSupportService.generateResponse(anyString(), anyString(), anyString(), anyMap()))
            .thenReturn(new java.util.HashMap<>(Map.of(
                "reply", "I understand your issue.",
                "actions", List.of()
            )));
        User requester = new User();
        requester.setId(5L);
        requester.setEmail("receiver@example.com");
        requester.setRole(UserRole.RECEIVER);
        requester.setLanguagePreference("en");
        User admin = new User();
        admin.setId(1L);
        admin.setEmail("admin@example.com");
        admin.setRole(UserRole.ADMIN);
        admin.setAccountStatus(com.example.foodflow.model.entity.AccountStatus.ACTIVE);
        Conversation conversation = new Conversation(requester, admin);
        conversation.setId(42L);
        when(userRepository.findByRole(UserRole.ADMIN)).thenReturn(List.of(admin));
        when(conversationService.createOrGetDirectConversation(requester, admin)).thenReturn(conversation);
        SupportChatRequest request = new SupportChatRequest();
        request.setMessage("I want to talk to support directly");
        request.setChatHistory(List.of(
            new SupportChatRequest.ChatMessage("user", "my claim shows wrong status since yesterday"),
            new SupportChatRequest.ChatMessage("assistant", "Can you share more details?"),
            new SupportChatRequest.ChatMessage("user", "I need a human to check it now")
        ));
        SupportChatResponse response = service.processChat(request, requester);
        assertThat(response.getIntent()).isEqualTo("SUPPORT_ESCALATED");
        assertThat(response.getActions()).isNotEmpty();
        assertThat(response.getActions().get(0).getValue())
            .isEqualTo("/receiver/messages?conversationId=42");
        ArgumentCaptor<com.example.foodflow.model.dto.MessageRequest> messageCaptor =
            ArgumentCaptor.forClass(com.example.foodflow.model.dto.MessageRequest.class);
        verify(messageService).sendMessage(messageCaptor.capture(), eq(requester));
        assertThat(messageCaptor.getValue().getMessageBody())
            .contains("[Support Escalation Ticket]")
            .contains("Context Summary:")
            .contains("my claim shows wrong status since yesterday")
            .contains("I need a human to check it now");
    }
}
