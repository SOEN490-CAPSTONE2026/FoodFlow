package com.example.foodflow.service;

import com.example.foodflow.model.dto.AttachPaymentMethodRequest;
import com.example.foodflow.model.dto.PaymentMethodResponse;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.PaymentMethod;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.types.PaymentMethodType;
import com.example.foodflow.repository.PaymentMethodRepository;
import com.stripe.exception.StripeException;
import com.stripe.param.PaymentMethodAttachParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentMethodService {
    
    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentAuditService paymentAuditService;
    
    @Transactional
    public PaymentMethodResponse attachPaymentMethod(AttachPaymentMethodRequest request, User user) {
        try {
            Organization organization = user.getOrganization();
            
            // Retrieve payment method from Stripe
            com.stripe.model.PaymentMethod stripePaymentMethod = 
                com.stripe.model.PaymentMethod.retrieve(request.getPaymentMethodId());
            
            // Attach to customer if needed (customer ID should be stored from payment creation)
            // For now, we'll just save the payment method details
            
            // Check if already attached
            if (paymentMethodRepository.existsByOrganizationIdAndStripePaymentMethodId(
                organization.getId(), request.getPaymentMethodId())) {
                throw new RuntimeException("Payment method already attached");
            }
            
            // Create payment method entity
            PaymentMethod paymentMethod = new PaymentMethod();
            paymentMethod.setOrganization(organization);
            paymentMethod.setStripePaymentMethodId(request.getPaymentMethodId());
            paymentMethod.setPaymentMethodType(mapPaymentMethodType(stripePaymentMethod.getType()));
            
            // Extract card details if card type
            if ("card".equals(stripePaymentMethod.getType())) {
                com.stripe.model.PaymentMethod.Card card = stripePaymentMethod.getCard();
                paymentMethod.setCardBrand(card.getBrand());
                paymentMethod.setCardLast4(card.getLast4());
                paymentMethod.setCardExpMonth(card.getExpMonth().intValue());
                paymentMethod.setCardExpYear(card.getExpYear().intValue());
            }
            
            // Extract bank details if ACH type
            if ("us_bank_account".equals(stripePaymentMethod.getType())) {
                com.stripe.model.PaymentMethod.UsBankAccount bankAccount = stripePaymentMethod.getUsBankAccount();
                paymentMethod.setBankName(bankAccount.getBankName());
                paymentMethod.setBankLast4(bankAccount.getLast4());
            }
            
            // Set as default if requested or if first payment method
            boolean isFirstMethod = paymentMethodRepository
                .findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(organization.getId())
                .isEmpty();
            
            if (request.getSetAsDefault() || isFirstMethod) {
                // Clear existing default
                paymentMethodRepository.clearDefaultForOrganization(organization.getId());
                paymentMethod.setIsDefault(true);
            }
            
            paymentMethod = paymentMethodRepository.save(paymentMethod);
            
            // Audit log
            paymentAuditService.logPaymentMethodEvent(paymentMethod.getId(), "PAYMENT_METHOD_ATTACHED",
                "Payment method attached: " + paymentMethod.getPaymentMethodType(), user.getId(), null);
            
            log.info("Payment method attached: {} for organization: {}", request.getPaymentMethodId(), organization.getId());
            
            return toPaymentMethodResponse(paymentMethod);
            
        } catch (StripeException e) {
            log.error("Stripe error attaching payment method: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to attach payment method: " + e.getUserMessage());
        }
    }
    
    @Transactional
    public void detachPaymentMethod(Long paymentMethodId, User user) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
            .orElseThrow(() -> new RuntimeException("Payment method not found"));
        
        // Verify user owns this payment method
        if (!paymentMethod.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment method");
        }
        
        try {
            // Detach from Stripe
            com.stripe.model.PaymentMethod stripePaymentMethod = 
                com.stripe.model.PaymentMethod.retrieve(paymentMethod.getStripePaymentMethodId());
            stripePaymentMethod.detach();
            
            // Delete from database
            paymentMethodRepository.delete(paymentMethod);
            
            // Audit log
            paymentAuditService.logPaymentMethodEvent(paymentMethodId, "PAYMENT_METHOD_DETACHED",
                "Payment method detached", user.getId(), null);
            
            log.info("Payment method detached: {}", paymentMethodId);
            
        } catch (StripeException e) {
            log.error("Stripe error detaching payment method: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to detach payment method: " + e.getUserMessage());
        }
    }
    
    @Transactional
    public PaymentMethodResponse setDefaultPaymentMethod(Long paymentMethodId, User user) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId)
            .orElseThrow(() -> new RuntimeException("Payment method not found"));
        
        // Verify user owns this payment method
        if (!paymentMethod.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new RuntimeException("Unauthorized access to payment method");
        }
        
        // Clear existing default
        paymentMethodRepository.clearDefaultForOrganization(user.getOrganization().getId());
        
        // Set new default
        paymentMethod.setIsDefault(true);
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        
        // Audit log
        paymentAuditService.logPaymentMethodEvent(paymentMethodId, "DEFAULT_PAYMENT_METHOD_SET",
            "Set as default payment method", user.getId(), null);
        
        log.info("Default payment method set: {}", paymentMethodId);
        
        return toPaymentMethodResponse(paymentMethod);
    }
    
    public List<PaymentMethodResponse> listPaymentMethods(User user) {
        Long organizationId = user.getOrganization().getId();
        List<PaymentMethod> methods = paymentMethodRepository
            .findByOrganizationIdOrderByIsDefaultDescCreatedAtDesc(organizationId);
        return methods.stream()
            .map(this::toPaymentMethodResponse)
            .collect(Collectors.toList());
    }
    
    public PaymentMethodResponse getDefaultPaymentMethod(User user) {
        Long organizationId = user.getOrganization().getId();
        return paymentMethodRepository.findByOrganizationIdAndIsDefaultTrue(organizationId)
            .map(this::toPaymentMethodResponse)
            .orElse(null);
    }
    
    private PaymentMethodType mapPaymentMethodType(String stripeType) {
        return switch (stripeType) {
            case "card" -> PaymentMethodType.CARD;
            case "us_bank_account" -> PaymentMethodType.ACH_DEBIT;
            case "sepa_debit" -> PaymentMethodType.SEPA_DEBIT;
            default -> PaymentMethodType.OTHER;
        };
    }
    
    private PaymentMethodResponse toPaymentMethodResponse(PaymentMethod method) {
        return PaymentMethodResponse.builder()
            .id(method.getId())
            .stripePaymentMethodId(method.getStripePaymentMethodId())
            .paymentMethodType(method.getPaymentMethodType())
            .cardBrand(method.getCardBrand())
            .cardLast4(method.getCardLast4())
            .cardExpMonth(method.getCardExpMonth())
            .cardExpYear(method.getCardExpYear())
            .bankName(method.getBankName())
            .bankLast4(method.getBankLast4())
            .isDefault(method.getIsDefault())
            .createdAt(method.getCreatedAt())
            .build();
    }
}
