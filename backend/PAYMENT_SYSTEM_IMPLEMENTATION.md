# Payment System Implementation Guide

## ✅ Completed Components

### 1. Dependencies & Configuration
- ✅ Added Stripe SDK (v24.18.0) to pom.xml
- ✅ Added iText7 for PDF generation
- ✅ Updated application.properties with Stripe configuration

### 2. Database Schema
- ✅ Created V62__Create_Payment_Tables.sql migration
- Tables: payments, payment_methods, invoices, refunds, payment_retries, stripe_webhook_events, payment_audit_logs
- ✅ All indexes created for performance

### 3. Entity Models
- ✅ Payment.java
- ✅ PaymentMethod.java
- ✅ Invoice.java
- ✅ Refund.java
- ✅ PaymentRetry.java
- ✅ StripeWebhookEvent.java
- ✅ PaymentAuditLog.java

### 4. Enum Types
- ✅ PaymentStatus
- ✅ PaymentType
- ✅ InvoiceStatus
- ✅ RefundStatus
- ✅ PaymentMethodType

### 5. Repositories
- ✅ PaymentRepository
- ✅ PaymentMethodRepository
- ✅ InvoiceRepository
- ✅ RefundRepository
- ✅ PaymentRetryRepository
- ✅ StripeWebhookEventRepository
- ✅ PaymentAuditLogRepository

## 🔨 Remaining Implementation Tasks

### Phase 1: DTOs (Request/Response Models) - 2 hours

Create in `model/dto/` package:

#### Payment DTOs
```java
// CreatePaymentRequest.java
@Data
public class CreatePaymentRequest {
    @NotNull
    private BigDecimal amount;
    
    @NotNull
    private String currency;
    
    @NotNull
    private PaymentType paymentType;
    
    private String description;
    private String paymentMethodId;
    private Map<String, String> metadata;
}

// PaymentResponse.java
// PaymentIntentResponse.java
// PaymentHistoryResponse.java
```

#### Payment Method DTOs
```java
// AttachPaymentMethodRequest.java
// PaymentMethodResponse.java
// SetDefaultPaymentMethodRequest.java
```

#### Invoice DTOs
```java
// InvoiceResponse.java
// GenerateInvoiceRequest.java
```

#### Refund DTOs
```java
// RefundRequest.java
// RefundResponse.java
```

### Phase 2: Core Services - 15 hours

#### StripeConfigService.java
```java
@Service
public class StripeConfigService {
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }
}
```

#### PaymentService.java - Key Methods
- createPaymentIntent()
- confirmPayment()
- cancelPayment()
- getPaymentHistory()
- getPaymentDetails()
- updatePaymentStatus()

#### PaymentMethodService.java - Key Methods
- attachPaymentMethod()
- detachPaymentMethod()
- setDefaultPaymentMethod()
- listPaymentMethods()
- getDefaultPaymentMethod()

#### InvoiceService.java - Key Methods
- generateInvoice()
- generatePDF() - Use iText7
- sendInvoiceEmail()
- getInvoiceById()
- generateInvoiceNumber()

#### RefundService.java - Key Methods
- processRefund()
- getRefundStatus()
- listRefunds()
- cancelRefund()

#### PaymentRetryService.java - Key Methods
- scheduleRetry()
- retryFailedPayment()
- processRetries() - @Scheduled task
- calculateBackoff()

#### CurrencyConversionService.java - Key Methods
- convertAmount()
- getSupportedCurrencies()
- getExchangeRate()

#### PaymentAuditService.java - Key Methods
- logPaymentEvent()
- getAuditTrail()
- logRefund()
- logPaymentMethodChange()

### Phase 3: Controllers - 8 hours

#### PaymentController.java - Endpoints
```java
POST   /api/payments/create-intent
POST   /api/payments/{id}/confirm
POST   /api/payments/{id}/cancel
GET    /api/payments/history
GET    /api/payments/{id}
POST   /api/payments/methods
GET    /api/payments/methods
DELETE /api/payments/methods/{id}
PUT    /api/payments/methods/{id}/default
```

#### InvoiceController.java - Endpoints
```java
GET    /api/invoices/{id}
GET    /api/invoices/{id}/pdf
GET    /api/invoices/my-invoices
POST   /api/invoices/{id}/send
```

#### RefundController.java - Endpoints
```java
POST   /api/refunds
GET    /api/refunds/{id}
GET    /api/refunds/my-refunds
GET    /api/refunds/payment/{paymentId}
```

#### StripeWebhookController.java - Critical!
```java
POST /api/webhooks/stripe

Event handlers:
- payment_intent.succeeded
- payment_intent.payment_failed
- payment_intent.canceled
- charge.refunded
- customer.created
- payment_method.attached
- payment_method.detached
```

### Phase 4: Testing - 10 hours

#### Unit Tests
- PaymentServiceTest.java
- PaymentMethodServiceTest.java
- InvoiceServiceTest.java
- RefundServiceTest.java
- PaymentRetryServiceTest.java

#### Integration Tests
- PaymentControllerTest.java
- WebhookControllerTest.java
- InvoiceControllerTest.java
- RefundControllerTest.java

#### Test Coverage Requirements
- Minimum 80% coverage per FoodFlow standards
- Use Mockito for mocking Stripe API calls
- Test with Stripe test cards

### Phase 5: Security & Compliance - 4 hours

#### PCI Compliance Checklist
1. ✅ Never store raw card data (using Stripe tokens)
2. ⚠️ Implement HTTPS-only enforcement
3. ⚠️ Add rate limiting to payment endpoints
4. ⚠️ Implement webhook signature verification
5. ⚠️ Add audit logging for all payment operations
6. ⚠️ Encrypt sensitive metadata fields
7. ⚠️ Implement idempotency keys

#### Security Configuration
```java
@Configuration
public class PaymentSecurityConfig {
    @Bean
    public SecurityFilterChain paymentFilterChain(HttpSecurity http) {
        http.authorizeHttpRequests()
            .requestMatchers("/api/payments/**").authenticated()
            .requestMatchers("/api/webhooks/stripe").permitAll();
        return http.build();
    }
}
```

### Phase 6: Scheduled Tasks - 2 hours

```java
@Component
public class PaymentScheduledTasks {
    
    @Scheduled(cron = "0 */30 * * * *") // Every 30 minutes
    public void retryFailedPayments() {
        paymentRetryService.processRetries();
    }
    
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    public void generateDailyInvoices() {
        invoiceService.generatePendingInvoices();
    }
    
    @Scheduled(cron = "0 0 */6 * * *") // Every 6 hours
    public void checkOverdueInvoices() {
        invoiceService.markOverdueInvoices();
    }
}
```

## 🔐 External Stripe Setup Required

### 1. Create Stripe Account
- Go to https://stripe.com
- Complete business verification

### 2. Get API Keys
```bash
# Add to .env file:
STRIPE_API_KEY=sk_test_xxxxx  # Secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Configure Webhooks
- URL: https://your-domain.com/api/webhooks/stripe
- Events to listen for:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - payment_intent.canceled
  - charge.refunded
  - customer.created
  - payment_method.attached
  - payment_method.detached

### 4. For Local Development
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:8080/api/webhooks/stripe
```

### 5. Enable Payment Methods
- Cards (Visa, Mastercard, Amex)
- ACH Direct Debit
- SEPA Direct Debit

### 6. Configure Multi-Currency (if needed)
- Enable in Stripe Dashboard → Settings → Multi-currency
- Supported: USD, CAD, EUR, GBP

## 🧪 Testing with Stripe Test Cards

```javascript
// Successful payment
Card: 4242 4242 4242 4242
Exp: 12/28
CVC: 123

// Card declined
Card: 4000 0000 0000 0002

// Insufficient funds
Card: 4000 0000 0000 9995

// Requires 3D Secure
Card: 4000 0027 6000 3184
```

## 📊 Metrics & Monitoring

Add to Prometheus metrics:
- payment_transactions_total
- payment_success_rate
- payment_processing_duration
- refund_transactions_total
- webhook_events_processed
- invoice_generation_total

## 🚀 Deployment Checklist

### Before Going Live:
- [ ] Complete business verification in Stripe
- [ ] Switch to live API keys
- [ ] Configure production webhook endpoint
- [ ] Test with real payment (small amount)
- [ ] Complete PCI compliance questionnaire
- [ ] Set up payment alerts
- [ ] Configure payout schedule
- [ ] Enable fraud detection (Radar)
- [ ] Set up 3D Secure authentication

### Post-Deployment:
- [ ] Monitor webhook delivery
- [ ] Check payment success rate
- [ ] Verify invoice generation
- [ ] Test refund process
- [ ] Monitor retry mechanism
- [ ] Review audit logs

## 📝 Implementation Timeline

**Total Estimated Time: 40 hours**

### Week 1 (16h):
- Day 1-2: Complete DTOs and core service implementations
- Day 3-4: Implement PaymentService and PaymentMethodService

### Week 2 (12h):
- Day 1-2: Implement InvoiceService with PDF generation
- Day 3: Implement RefundService and PaymentRetryService

### Week 3 (12h):
- Day 1-2: Implement all controllers
- Day 3: Implement StripeWebhookController (critical!)

### Week 4+ (Testing & Polish):
- Write comprehensive unit tests
- Integration testing
- Security audit
- Load testing
- Documentation

## ⚠️ Critical Notes

1. **Never store card data**: Always use Stripe's tokenization
2. **Webhook verification**: Always verify webhook signatures
3. **Idempotency**: Use idempotency keys for all payment operations
4. **Error handling**: Never expose Stripe error details to users
5. **Audit everything**: Log all payment-related actions
6. **HTTPS only**: Never handle payments over HTTP
7. **Rate limiting**: Prevent abuse of payment endpoints

## 🔗 Useful Resources

- Stripe API Docs: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Webhooks: https://stripe.com/docs/webhooks
- PCI Compliance: https://stripe.com/docs/security
- iText7 Docs: https://itextpdf.com/en/resources/api-documentation

## 💡 Next Steps

1. **Implement DTOs** - Start with CreatePaymentRequest and PaymentResponse
2. **Create StripeConfigService** - Initialize Stripe SDK
3. **Implement PaymentService** - Core payment logic
4. **Create PaymentController** - REST endpoints
5. **Implement WebhookController** - Handle Stripe events
6. **Add comprehensive tests** - Achieve 80% coverage
7. **Security audit** - Ensure PCI compliance
8. **External Stripe setup** - Configure account and webhooks
9. **Testing** - Test with Stripe test environment
10. **Go live** - Switch to production keys

---

**Status**: Foundation Complete ✅ | Services In Progress 🔨 | Testing Pending ⏳
