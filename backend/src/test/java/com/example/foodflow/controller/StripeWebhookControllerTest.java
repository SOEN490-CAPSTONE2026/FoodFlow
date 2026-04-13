package com.example.foodflow.controller;
import com.example.foodflow.model.entity.StripeWebhookEvent;
import com.example.foodflow.model.types.PaymentStatus;
import com.example.foodflow.repository.StripeWebhookEventRepository;
import com.example.foodflow.service.PaymentService;
import com.example.foodflow.service.RefundService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class StripeWebhookControllerTest {
    @Mock
    private PaymentService paymentService;
    @Mock
    private RefundService refundService;
    @Mock
    private StripeWebhookEventRepository webhookEventRepository;
    @InjectMocks
    private StripeWebhookController controller;
    private static final String WEBHOOK_SECRET = "whsec_test_secret";
    private static final String VALID_SIGNATURE = "valid_signature";
    private static final String INVALID_SIGNATURE = "invalid_signature";
    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(controller, "webhookSecret", WEBHOOK_SECRET);
    }
    @Test
    void testHandleStripeWebhook_PaymentIntentSucceeded_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_123\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = createMockEvent("evt_123", "payment_intent.succeeded");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_123");
        when(webhookEventRepository.existsByStripeEventId("evt_123")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            // Mock event data deserializer
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
            verify(paymentService).updatePaymentStatus("pi_123", PaymentStatus.SUCCEEDED);
            verify(webhookEventRepository, times(2)).save(any(StripeWebhookEvent.class));
        }
    }
    @Test
    void testHandleStripeWebhook_PaymentIntentFailed_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_124\",\"type\":\"payment_intent.payment_failed\"}";
        Event mockEvent = createMockEvent("evt_124", "payment_intent.payment_failed");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_124");
        when(webhookEventRepository.existsByStripeEventId("evt_124")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).updatePaymentStatus("pi_124", PaymentStatus.FAILED);
        }
    }
    @Test
    void testHandleStripeWebhook_PaymentIntentCanceled_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_125\",\"type\":\"payment_intent.canceled\"}";
        Event mockEvent = createMockEvent("evt_125", "payment_intent.canceled");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_125");
        when(webhookEventRepository.existsByStripeEventId("evt_125")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).updatePaymentStatus("pi_125", PaymentStatus.CANCELED);
        }
    }
    @Test
    void testHandleStripeWebhook_PaymentIntentRequiresAction_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_126\",\"type\":\"payment_intent.requires_action\"}";
        Event mockEvent = createMockEvent("evt_126", "payment_intent.requires_action");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_126");
        when(webhookEventRepository.existsByStripeEventId("evt_126")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).updatePaymentStatus("pi_126", PaymentStatus.REQUIRES_ACTION);
        }
    }
    @Test
    void testHandleStripeWebhook_ChargeRefunded_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_127\",\"type\":\"charge.refunded\"}";
        Event mockEvent = createMockEvent("evt_127", "charge.refunded");
        com.stripe.model.Charge mockCharge = mock(com.stripe.model.Charge.class);
        when(mockCharge.getId()).thenReturn("ch_123");
        when(webhookEventRepository.existsByStripeEventId("evt_127")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockCharge));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
        }
    }
    @Test
    void testHandleStripeWebhook_CustomerCreated_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_128\",\"type\":\"customer.created\"}";
        Event mockEvent = createMockEvent("evt_128", "customer.created");
        com.stripe.model.Customer mockCustomer = mock(com.stripe.model.Customer.class);
        when(mockCustomer.getId()).thenReturn("cus_123");
        when(webhookEventRepository.existsByStripeEventId("evt_128")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockCustomer));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
        }
    }
    @Test
    void testHandleStripeWebhook_PaymentMethodAttached_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_129\",\"type\":\"payment_method.attached\"}";
        Event mockEvent = createMockEvent("evt_129", "payment_method.attached");
        com.stripe.model.PaymentMethod mockPaymentMethod = mock(com.stripe.model.PaymentMethod.class);
        when(mockPaymentMethod.getId()).thenReturn("pm_123");
        when(webhookEventRepository.existsByStripeEventId("evt_129")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentMethod));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
        }
    }
    @Test
    void testHandleStripeWebhook_PaymentMethodDetached_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_130\",\"type\":\"payment_method.detached\"}";
        Event mockEvent = createMockEvent("evt_130", "payment_method.detached");
        com.stripe.model.PaymentMethod mockPaymentMethod = mock(com.stripe.model.PaymentMethod.class);
        when(mockPaymentMethod.getId()).thenReturn("pm_124");
        when(webhookEventRepository.existsByStripeEventId("evt_130")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentMethod));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
        }
    }
    @Test
    void testHandleStripeWebhook_UnhandledEventType_Success() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_131\",\"type\":\"account.updated\"}";
        Event mockEvent = createMockEvent("evt_131", "account.updated");
        when(webhookEventRepository.existsByStripeEventId("evt_131")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Success");
            // Verify event was still saved and marked processed
            verify(webhookEventRepository, times(2)).save(any(StripeWebhookEvent.class));
        }
    }
    @Test
    void testHandleStripeWebhook_DuplicateEvent_ReturnsOk() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_duplicate\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = mock(Event.class);
        lenient().when(mockEvent.getId()).thenReturn("evt_duplicate");
        lenient().when(mockEvent.getType()).thenReturn("payment_intent.succeeded");
        when(webhookEventRepository.existsByStripeEventId("evt_duplicate")).thenReturn(true);
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Duplicate event");
            // Verify event was not saved again and payment service was not called
            verify(webhookEventRepository, never()).save(any(StripeWebhookEvent.class));
            verify(paymentService, never()).updatePaymentStatus(anyString(), any());
        }
    }
    @Test
    void testHandleStripeWebhook_InvalidSignature_ReturnsBadRequest() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_invalid\",\"type\":\"payment_intent.succeeded\"}";
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, INVALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenThrow(new SignatureVerificationException("Invalid signature", "sig_header"));
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, INVALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Invalid signature");
            verify(webhookEventRepository, never()).save(any(StripeWebhookEvent.class));
            verify(paymentService, never()).updatePaymentStatus(anyString(), any());
        }
    }
    @Test
    void testHandleStripeWebhook_ProcessingError_ReturnsInternalServerError() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_error\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = createMockEvent("evt_error", "payment_intent.succeeded");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_error");
        when(webhookEventRepository.existsByStripeEventId("evt_error")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // Simulate error during payment status update
            doThrow(new RuntimeException("Database connection failed"))
                    .when(paymentService).updatePaymentStatus(anyString(), any());
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isEqualTo("Error processing webhook");
            // Verify event was saved with error message
            ArgumentCaptor<StripeWebhookEvent> eventCaptor = ArgumentCaptor.forClass(StripeWebhookEvent.class);
            verify(webhookEventRepository, atLeastOnce()).save(eventCaptor.capture());
        }
    }
    @Test
    void testHandleStripeWebhook_DeserializationError_ReturnsInternalServerError() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_deser_error\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = createMockEvent("evt_deser_error", "payment_intent.succeeded");
        when(webhookEventRepository.existsByStripeEventId("evt_deser_error")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.empty());
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isEqualTo("Error processing webhook");
        }
    }
    @Test
    void testHandleStripeWebhook_SavesEventWithCorrectFields() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_fields\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = createMockEvent("evt_fields", "payment_intent.succeeded");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_fields");
        ArgumentCaptor<StripeWebhookEvent> eventCaptor = ArgumentCaptor.forClass(StripeWebhookEvent.class);
        when(webhookEventRepository.existsByStripeEventId("evt_fields")).thenReturn(false);
        when(webhookEventRepository.save(eventCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            // When
            controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            verify(webhookEventRepository, times(2)).save(any(StripeWebhookEvent.class));
            // Get the captured values
            java.util.List<StripeWebhookEvent> allSaves = eventCaptor.getAllValues();
            assertThat(allSaves).hasSize(2);
            // Verify the event has correct fields (same object is saved twice, updated in place)
            StripeWebhookEvent event = allSaves.get(0);
            assertThat(event.getStripeEventId()).isEqualTo("evt_fields");
            assertThat(event.getEventType()).isEqualTo("payment_intent.succeeded");
            assertThat(event.getPayload()).isEqualTo(payload);
            // Verify second save has processedAt set (same object reference, so it's updated)
            StripeWebhookEvent secondSave = allSaves.get(1);
            assertThat(secondSave.getProcessedAt()).isNotNull();
            assertThat(secondSave.getStripeEventId()).isEqualTo("evt_fields");
        }
    }
    @Test
    void testHandleStripeWebhook_EventProcessingException_SetsErrorMessage() throws Exception {
        // Given
        String payload = "{\"id\":\"evt_exception\",\"type\":\"payment_intent.succeeded\"}";
        Event mockEvent = createMockEvent("evt_exception", "payment_intent.succeeded");
        PaymentIntent mockPaymentIntent = createMockPaymentIntent("pi_exception");
        when(webhookEventRepository.existsByStripeEventId("evt_exception")).thenReturn(false);
        when(webhookEventRepository.save(any(StripeWebhookEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try (MockedStatic<Webhook> webhookMock = mockStatic(Webhook.class)) {
            webhookMock.when(() -> Webhook.constructEvent(payload, VALID_SIGNATURE, WEBHOOK_SECRET))
                    .thenReturn(mockEvent);
            EventDataObjectDeserializer mockDeserializer = mock(EventDataObjectDeserializer.class);
            when(mockEvent.getDataObjectDeserializer()).thenReturn(mockDeserializer);
            when(mockDeserializer.getObject()).thenReturn(Optional.of(mockPaymentIntent));
            doThrow(new RuntimeException("Payment update failed"))
                    .when(paymentService).updatePaymentStatus(anyString(), any());
            // When
            ResponseEntity<String> response = controller.handleStripeWebhook(payload, VALID_SIGNATURE);
            // Then
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            ArgumentCaptor<StripeWebhookEvent> eventCaptor = ArgumentCaptor.forClass(StripeWebhookEvent.class);
            verify(webhookEventRepository, atLeastOnce()).save(eventCaptor.capture());
            // At least one save should have the error message set
            boolean hasErrorMessage = eventCaptor.getAllValues().stream()
                    .anyMatch(event -> event.getErrorMessage() != null);
            assertThat(hasErrorMessage).isTrue();
        }
    }
    // Helper methods
    private Event createMockEvent(String eventId, String eventType) {
        Event mockEvent = mock(Event.class);
        when(mockEvent.getId()).thenReturn(eventId);
        when(mockEvent.getType()).thenReturn(eventType);
        return mockEvent;
    }
    private PaymentIntent createMockPaymentIntent(String paymentIntentId) {
        PaymentIntent mockPaymentIntent = mock(PaymentIntent.class);
        when(mockPaymentIntent.getId()).thenReturn(paymentIntentId);
        return mockPaymentIntent;
    }
}
