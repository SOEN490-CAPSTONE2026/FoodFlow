package com.example.foodflow.service;

import com.example.foodflow.model.dto.AttachPaymentMethodRequest;
import com.example.foodflow.model.dto.PaymentMethodResponse;
import com.example.foodflow.model.dto.SetupIntentResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.PaymentMethod;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentMethodType;
import com.example.foodflow.repository.PaymentMethodRepository;
import com.stripe.model.Customer;
import com.stripe.exception.StripeException;
import com.stripe.model.SetupIntent;
import com.stripe.param.SetupIntentCreateParams;
import com.stripe.param.CustomerUpdateParams;
import com.stripe.param.PaymentMethodAttachParams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentMethodServiceTest {

    @Mock
    private PaymentMethodRepository paymentMethodRepository;

    @Mock
    private PaymentAuditService paymentAuditService;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentMethodService paymentMethodService;

    private User user;
    private Organization organization;
    private PaymentMethod paymentMethod;

    @BeforeEach
    void setUp() {
        organization = new Organization();
        organization.setId(1L);
        organization.setName("Test Organization");

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setOrganization(organization);

        paymentMethod = new PaymentMethod();
        paymentMethod.setId(1L);
        paymentMethod.setOrganization(organization);
        paymentMethod.setStripePaymentMethodId("pm_test123");
        paymentMethod.setPaymentMethodType(PaymentMethodType.CARD);
        paymentMethod.setCardBrand("visa");
        paymentMethod.setCardLast4("4242");
        paymentMethod.setIsDefault(false);
    }

    @Test
    void setDefaultPaymentMethod_Success() throws StripeException {
        // Given
        Customer customer = mock(Customer.class);
        when(paymentMethodRepository.findById(1L)).thenReturn(Optional.of(paymentMethod));
        when(paymentService.getOrCreateStripeCustomerId(user)).thenReturn("cus_test123");
        when(paymentMethodRepository.save(any(PaymentMethod.class)))
                .thenAnswer(invocation -> {
                    PaymentMethod pm = invocation.getArgument(0);
                    pm.setIsDefault(true);
                    return pm;
                });
        when(customer.update(any(CustomerUpdateParams.class))).thenReturn(customer);

        try (MockedStatic<Customer> customerMock = mockStatic(Customer.class)) {
            customerMock.when(() -> Customer.retrieve("cus_test123")).thenReturn(customer);

            // When
            PaymentMethodResponse response = paymentMethodService.setDefaultPaymentMethod(1L, user);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getIsDefault()).isTrue();
            verify(paymentMethodRepository).clearDefaultForOrganization(organization.getId());
            verify(paymentAuditService).logPaymentMethodEvent(eq(1L), eq("DEFAULT_PAYMENT_METHOD_SET"), anyString(), eq(1L), isNull());
            verify(customer).update(any(CustomerUpdateParams.class));
        }
    }

    @Test
    void setDefaultPaymentMethod_NotFound_ThrowsException() {
        // Given
        when(paymentMethodRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> paymentMethodService.setDefaultPaymentMethod(999L, user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Payment method not found");
    }

    @Test
    void setDefaultPaymentMethod_UnauthorizedAccess_ThrowsException() {
        // Given
        Organization otherOrg = new Organization();
        otherOrg.setId(999L);
        paymentMethod.setOrganization(otherOrg);

        when(paymentMethodRepository.findById(1L)).thenReturn(Optional.of(paymentMethod));

        // When & Then
        assertThatThrownBy(() -> paymentMethodService.setDefaultPaymentMethod(1L, user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized access to payment method");

        verify(paymentMethodRepository, never()).save(any());
    }

    @Test
    void listPaymentMethods_ReturnsMultipleMethods() {
        // Given
        PaymentMethod method1 = new PaymentMethod();
        method1.setId(1L);
        method1.setIsDefault(true);
        method1.setPaymentMethodType(PaymentMethodType.CARD);
        method1.setCardBrand("visa");
        method1.setCardLast4("4242");

        PaymentMethod method2 = new PaymentMethod();
        method2.setId(2L);
        method2.setIsDefault(false);
        method2.setPaymentMethodType(PaymentMethodType.ACH_DEBIT);
        method2.setBankName("Chase");
        method2.setBankLast4("6789");

        when(paymentMethodRepository.findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(organization.getId()))
                .thenReturn(Arrays.asList(method1, method2));

        // When
        List<PaymentMethodResponse> responses = paymentMethodService.listPaymentMethods(user);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getIsDefault()).isTrue();
        assertThat(responses.get(0).getPaymentMethodType()).isEqualTo(PaymentMethodType.CARD);
        assertThat(responses.get(1).getIsDefault()).isFalse();
        assertThat(responses.get(1).getPaymentMethodType()).isEqualTo(PaymentMethodType.ACH_DEBIT);
    }

    @Test
    void listPaymentMethods_EmptyList() {
        // Given
        when(paymentMethodRepository.findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(organization.getId()))
                .thenReturn(Collections.emptyList());

        // When
        List<PaymentMethodResponse> responses = paymentMethodService.listPaymentMethods(user);

        // Then
        assertThat(responses).isEmpty();
    }

    @Test
    void getDefaultPaymentMethod_Found() {
        // Given
        paymentMethod.setIsDefault(true);
        when(paymentMethodRepository.findByOrganizationIdAndIsDefaultTrue(organization.getId()))
                .thenReturn(Optional.of(paymentMethod));

        // When
        PaymentMethodResponse response = paymentMethodService.getDefaultPaymentMethod(user);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getIsDefault()).isTrue();
        assertThat(response.getCardBrand()).isEqualTo("visa");
    }

    @Test
    void getDefaultPaymentMethod_NotFound() {
        // Given
        when(paymentMethodRepository.findByOrganizationIdAndIsDefaultTrue(organization.getId()))
                .thenReturn(Optional.empty());

        // When
        PaymentMethodResponse response = paymentMethodService.getDefaultPaymentMethod(user);

        // Then
        assertThat(response).isNull();
    }

    @Test
    void listPaymentMethods_SingleMethod() {
        // Given
        when(paymentMethodRepository.findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(organization.getId()))
                .thenReturn(Arrays.asList(paymentMethod));

        // When
        List<PaymentMethodResponse> responses = paymentMethodService.listPaymentMethods(user);

        // Then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void setDefaultPaymentMethod_UpdatesIsDefaultFlag() throws StripeException {
        // Given
        Customer customer = mock(Customer.class);
        paymentMethod.setIsDefault(false);
        when(paymentMethodRepository.findById(1L)).thenReturn(Optional.of(paymentMethod));
        when(paymentService.getOrCreateStripeCustomerId(user)).thenReturn("cus_test123");
        when(paymentMethodRepository.save(any(PaymentMethod.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(customer.update(any(CustomerUpdateParams.class))).thenReturn(customer);

        try (MockedStatic<Customer> customerMock = mockStatic(Customer.class)) {
            customerMock.when(() -> Customer.retrieve("cus_test123")).thenReturn(customer);

            // When
            paymentMethodService.setDefaultPaymentMethod(1L, user);

            // Then
            verify(paymentMethodRepository).save(argThat(pm -> pm.getIsDefault() == true));
            verify(customer).update(any(CustomerUpdateParams.class));
        }
    }

    @Test
    void listPaymentMethods_VerifiesOrganizationId() {
        // Given
        when(paymentMethodRepository.findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(1L))
                .thenReturn(Arrays.asList(paymentMethod));

        // When
        paymentMethodService.listPaymentMethods(user);

        // Then
        verify(paymentMethodRepository).findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(1L);
    }

    @Test
    void getDefaultPaymentMethod_VerifiesOrganizationId() {
        // Given
        when(paymentMethodRepository.findByOrganizationIdAndIsDefaultTrue(1L))
                .thenReturn(Optional.empty());

        // When
        paymentMethodService.getDefaultPaymentMethod(user);

        // Then
        verify(paymentMethodRepository).findByOrganizationIdAndIsDefaultTrue(1L);
    }

    @Test
    void createSetupIntent_Success() throws StripeException {
        SetupIntent stripeSetupIntent = mock(SetupIntent.class);
        when(stripeSetupIntent.getClientSecret()).thenReturn("seti_secret");
        when(stripeSetupIntent.getId()).thenReturn("seti_123");
        when(stripeSetupIntent.getStatus()).thenReturn("requires_payment_method");
        when(paymentService.getOrCreateStripeCustomerId(user)).thenReturn("cus_test123");

        try (MockedStatic<SetupIntent> setupIntentMock = mockStatic(SetupIntent.class)) {
            setupIntentMock
                .when(() -> SetupIntent.create(any(SetupIntentCreateParams.class)))
                .thenReturn(stripeSetupIntent);

            SetupIntentResponse response = paymentMethodService.createSetupIntent(user);

            assertThat(response.getClientSecret()).isEqualTo("seti_secret");
            assertThat(response.getSetupIntentId()).isEqualTo("seti_123");
            setupIntentMock.verify(() -> SetupIntent.create(argThat((SetupIntentCreateParams params) ->
                "cus_test123".equals(params.getCustomer())
                    && SetupIntentCreateParams.Usage.OFF_SESSION.equals(params.getUsage())
            )));
        }
    }

    @Test
    void createSetupIntent_StripeError() throws StripeException {
        when(paymentService.getOrCreateStripeCustomerId(user)).thenReturn("cus_test123");
        try (MockedStatic<SetupIntent> setupIntentMock = mockStatic(SetupIntent.class)) {
            StripeException stripeException = mock(StripeException.class);
            when(stripeException.getUserMessage()).thenReturn("Setup error");
            setupIntentMock
                .when(() -> SetupIntent.create(any(SetupIntentCreateParams.class)))
                .thenThrow(stripeException);

            assertThatThrownBy(() -> paymentMethodService.createSetupIntent(user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Setup error");
        }
    }

    @Test
    void attachPaymentMethod_AttachesToCustomerAndSetsDefault() throws StripeException {
        AttachPaymentMethodRequest request = new AttachPaymentMethodRequest("pm_test123", true);

        com.stripe.model.PaymentMethod stripePaymentMethod = mock(com.stripe.model.PaymentMethod.class);
        com.stripe.model.PaymentMethod.Card stripeCard = mock(com.stripe.model.PaymentMethod.Card.class);
        Customer customer = mock(Customer.class);

        when(paymentService.getOrCreateStripeCustomerId(user)).thenReturn("cus_test123");
        when(stripePaymentMethod.getCustomer()).thenReturn(null);
        when(stripePaymentMethod.attach(any(PaymentMethodAttachParams.class)))
            .thenReturn(stripePaymentMethod);
        when(stripePaymentMethod.getType()).thenReturn("card");
        when(stripePaymentMethod.getCard()).thenReturn(stripeCard);
        when(stripeCard.getBrand()).thenReturn("visa");
        when(stripeCard.getLast4()).thenReturn("4242");
        when(stripeCard.getExpMonth()).thenReturn(12L);
        when(stripeCard.getExpYear()).thenReturn(2030L);
        when(paymentMethodRepository.existsByOrganizationIdAndStripePaymentMethodId(1L, "pm_test123"))
            .thenReturn(false);
        when(paymentMethodRepository.findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(1L))
            .thenReturn(Collections.emptyList());
        when(paymentMethodRepository.save(any(PaymentMethod.class)))
            .thenAnswer(invocation -> {
                PaymentMethod saved = invocation.getArgument(0);
                saved.setId(99L);
                return saved;
            });
        when(customer.update(any(CustomerUpdateParams.class))).thenReturn(customer);

        try (
            MockedStatic<com.stripe.model.PaymentMethod> paymentMethodMock =
                mockStatic(com.stripe.model.PaymentMethod.class);
            MockedStatic<Customer> customerMock = mockStatic(Customer.class)
        ) {
            paymentMethodMock
                .when(() -> com.stripe.model.PaymentMethod.retrieve("pm_test123"))
                .thenReturn(stripePaymentMethod);
            customerMock.when(() -> Customer.retrieve("cus_test123")).thenReturn(customer);

            PaymentMethodResponse response = paymentMethodService.attachPaymentMethod(request, user);

            assertThat(response.getId()).isEqualTo(99L);
            assertThat(response.getIsDefault()).isTrue();
            assertThat(response.getCardBrand()).isEqualTo("visa");
            verify(stripePaymentMethod).attach(argThat((PaymentMethodAttachParams params) ->
                "cus_test123".equals(params.getCustomer())
            ));
            verify(customer).update(argThat((CustomerUpdateParams params) ->
                params.getInvoiceSettings() != null
                    && "pm_test123".equals(params.getInvoiceSettings().getDefaultPaymentMethod())
            ));
            verify(paymentMethodRepository).clearDefaultForOrganization(1L);
        }
    }
}
