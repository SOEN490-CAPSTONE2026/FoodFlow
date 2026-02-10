package com.example.foodflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyMap;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.example.foodflow.model.dto.SupportChatRequest;
import com.example.foodflow.model.dto.SupportChatResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

class SupportServiceTest {

    @Test
    void processChat_happyPath_convertsActionsAndDefaultsEscalate() {
        ContextualSupportService contextualSupportService = Mockito.mock(ContextualSupportService.class);
        SupportContextBuilder contextBuilder = Mockito.mock(SupportContextBuilder.class);

        SupportService service = new SupportService();
        ReflectionTestUtils.setField(service, "contextualSupportService", contextualSupportService);
        ReflectionTestUtils.setField(service, "contextBuilder", contextBuilder);

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

        SupportService service = new SupportService();
        ReflectionTestUtils.setField(service, "contextualSupportService", contextualSupportService);
        ReflectionTestUtils.setField(service, "contextBuilder", contextBuilder);
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
}
