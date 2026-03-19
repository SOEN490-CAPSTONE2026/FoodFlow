# 💳 FoodFlow Payment System - Setup & Testing Guide

## ✅ What's Been Completed

Your payment system is now **100% implemented** and ready to test!

### Backend (Java/Spring Boot)
- ✅ 7 Database tables (migration V62)
- ✅ 5 Enums, 7 Entities, 7 Repositories
- ✅ 8 DTOs for API requests/responses
- ✅ 7 Services (Payment, PaymentMethod, Refund, Invoice, Audit, Config, Metrics)
- ✅ 3 Controllers (Payment, Refund, StripeWebhook)
- ✅ Complete Stripe integration

### Frontend (React)
- ✅ PaymentPage component with 2-step flow
- ✅ Stripe Elements integration
- ✅ Success/Error pages
- ✅ Routes configured (`/payment`, `/payment/success`)
- ✅ Stripe React libraries installed

## 🚀 Quick Start - Testing the Payment System

### Step 1: Get Stripe Test API Keys

1. **Sign up for Stripe**: https://dashboard.stripe.com/register
2. **Switch to Test Mode** (toggle in top-right corner)
3. **Get your API keys**: https://dashboard.stripe.com/test/apikeys
   - **Publishable key**: `pk_test_...` (starts with pk_test)
   - **Secret key**: `sk_test_...` (starts with sk_test)

### Step 2: Configure Environment Variables

**Frontend (.env file - `FoodFlow/frontend/.env`):**
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51QdKGrP... # YOUR KEY HERE
```

**Backend (.env file - `FoodFlow/.env` or application.properties):**
```bash
STRIPE_API_KEY=sk_test_51QdKGrP... # YOUR SECRET KEY HERE
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe CLI (see Step 4)
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd FoodFlow/backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd FoodFlow/frontend
npm start
```

Wait for both to start. Frontend should open at http://localhost:3000

### Step 4: Set Up Webhook Testing (Optional but Recommended)

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
# Login to Stripe
stripe login

# Forward webhooks to your local backend
stripe listen --forward-to localhost:8080/api/webhooks/stripe

# This will output a webhook secret like: whsec_abc123...
# Copy this to your backend .env file
```

### Step 5: Test the Payment Flow

1. **Navigate to payment page**: http://localhost:3000/payment
2. **Select an amount** ($5, $10, $25, or custom)
3. **Click "Continue to Payment"**
4. **Enter test card details:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. **Click "Donate"**
6. **Success!** You should be redirected to the success page

### Step 6: Verify in Database

```sql
-- Check if payment was created
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Check payment audit log
SELECT * FROM payment_audit_logs ORDER BY created_at DESC LIMIT 5;

-- Check webhook events (if webhook CLI is running)
SELECT * FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 5;
```

## 🧪 Stripe Test Cards

### Successful Payments
- **Basic success**: `4242 4242 4242 4242`
- **3D Secure required**: `4000 0027 6000 3184`

### Failed Payments
- **Generic decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Lost card**: `4000 0000 0000 9987`

### Other Test Scenarios
- **Disputed payment**: `4000 0000 0000 0259`
- **Refund required**: Complete any successful payment, then test refund

## 📍 API Endpoints Available

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/{id}/confirm` - Confirm payment
- `POST /api/payments/{id}/cancel` - Cancel payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/{id}` - Get payment details

### Payment Methods
- `POST /api/payments/methods` - Attach payment method
- `GET /api/payments/methods` - List payment methods
- `DELETE /api/payments/methods/{id}` - Delete payment method
- `PUT /api/payments/methods/{id}/default` - Set default

### Refunds
- `POST /api/refunds` - Process refund
- `GET /api/refunds/payment/{paymentId}` - Get refunds for payment

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🔍 Testing Checklist

- [ ] Navigate to http://localhost:3000/payment
- [ ] Select $25 donation amount
- [ ] Continue to payment step
- [ ] See Stripe payment form appear
- [ ] Enter test card `4242 4242 4242 4242`
- [ ] Submit payment
- [ ] Redirected to success page
- [ ] Check database for payment record
- [ ] Check backend logs for payment processing
- [ ] Try failed payment with `4000 0000 0000 0002`
- [ ] Verify error handling works

## 🐛 Troubleshooting

### "Stripe publishable key not set" Error
- Make sure you added the key to `frontend/.env`
- Restart the frontend: `npm start`

### "Failed to create payment intent" Error
- Check backend is running on port 8080
- Verify Stripe secret key in backend .env
- Check backend console logs for errors
- Make sure you're logged in (payment requires authentication)

### Webhook Events Not Received
- Make sure Stripe CLI is running: `stripe listen`
- Check webhook secret is correct in backend .env
- Verify webhook endpoint: http://localhost:8080/api/webhooks/stripe

### CORS Errors
- Backend should have CORS enabled for http://localhost:3000
- Check `application.properties` for CORS configuration

## 📊 Monitoring

Check these after testing:

**Backend Logs:**
```
[INFO] Payment intent created: pi_xxx for organization: 123
[INFO] Payment status updated: PENDING -> SUCCEEDED
[INFO] Successfully processed webhook event: payment_intent.succeeded
```

**Database Records:**
```sql
-- View recent payments
SELECT id, amount, currency, status, created_at 
FROM payments 
ORDER BY created_at DESC LIMIT 10;

-- View audit trail
SELECT action, details, created_at 
FROM payment_audit_logs 
ORDER BY created_at DESC LIMIT 10;
```

**Stripe Dashboard:**
- Go to https://dashboard.stripe.com/test/payments
- You should see your test payments listed

## 🎯 Next Steps

### For Development
1. Test all test cards to verify error handling
2. Test refund flow
3. Test payment method management
4. Add payment history page for users
5. Add "Donate Now" button to landing page/navbar

### For Production
1. Switch to live Stripe keys (remove `_test_` from keys)
2. Complete Stripe account verification
3. Configure production webhook endpoint
4. Enable Stripe Radar (fraud detection)
5. Set up 3D Secure authentication
6. Complete PCI compliance questionnaire

## 📚 Additional Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Testing Guide**: https://stripe.com/docs/testing
- **Stripe Elements Docs**: https://stripe.com/docs/stripe-js
- **Webhook Testing**: https://stripe.com/docs/webhooks/test

---

## 🎉 You're All Set!

Navigate to **http://localhost:3000/payment** to test your new payment system!

**Test Card**: 4242 4242 4242 4242 | Any future date | Any CVC

For questions or issues, check the logs or Stripe Dashboard for more details.
