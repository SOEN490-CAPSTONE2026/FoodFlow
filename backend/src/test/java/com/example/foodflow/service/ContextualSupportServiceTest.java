package com.example.foodflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.test.util.ReflectionTestUtils;

class ContextualSupportServiceTest {

    @Test
    void generateResponse_contactSupport_addsActionsAndNoEscalate() {
        ContextualSupportService service =
            new ContextualSupportService(new DefaultResourceLoader(), new ObjectMapper());
        OpenAIService openAIService = org.mockito.Mockito.mock(OpenAIService.class);
        ReflectionTestUtils.setField(service, "openAIService", openAIService);

        when(openAIService.generateSupportResponse(org.mockito.Mockito.anyString(),
                org.mockito.Mockito.anyString(),
                org.mockito.Mockito.any(),
                org.mockito.Mockito.anyString()))
            .thenReturn("Here is how to contact support.");

        Map<String, Object> result = service.generateResponse(
            "How do I contact support?",
            "DONOR",
            "en",
            Map.of("userPreferences", Map.of("timezone", "UTC"))
        );

        assertThat(result.get("reply")).isEqualTo("Here is how to contact support.");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> actions = (List<Map<String, Object>>) result.get("actions");
        assertThat(actions).isNotEmpty();
        assertThat(actions.get(0).get("type")).isEqualTo("contact");
        assertThat(actions.get(0).get("value")).isEqualTo("support@foodflow.com");
        assertThat(actions.stream().anyMatch(a -> "/donor/help".equals(a.get("value")))).isTrue();
        assertThat(result.get("escalate")).isEqualTo(false);
    }

    @Test
    void generateResponse_whenOpenAiThrows_returnsFallback() {
        ContextualSupportService service =
            new ContextualSupportService(new DefaultResourceLoader(), new ObjectMapper());
        OpenAIService openAIService = org.mockito.Mockito.mock(OpenAIService.class);
        ReflectionTestUtils.setField(service, "openAIService", openAIService);

        doThrow(new RuntimeException("boom")).when(openAIService)
            .generateSupportResponse(org.mockito.Mockito.anyString(),
                org.mockito.Mockito.anyString(),
                org.mockito.Mockito.any(),
                org.mockito.Mockito.anyString());

        Map<String, Object> result = service.generateResponse(
            "General help",
            "RECEIVER",
            "en",
            Map.of()
        );

        assertThat(result.get("reply").toString())
            .contains("trouble processing");
        assertThat(result.get("escalate")).isEqualTo(true);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> actions = (List<Map<String, Object>>) result.get("actions");
        assertThat(actions).isNotEmpty();
    }
}
