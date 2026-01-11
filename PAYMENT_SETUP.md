# Payment Integration Setup Guide

This guide walks you through setting up Stripe payment processing for the Farm Equipment Rental application.

## Step 1: Install Dependencies

### Server
```bash
cd d:\react_js_project\farmers\server
npm install stripe
```

### Client
```bash
cd d:\react_js_project\farmers\client
npm install @stripe/react-stripe-js @stripe/stripe-js
```

## Step 2: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Sign up or log in to your Stripe account
3. Copy your:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
4. Go to [Webhook Endpoints](https://dashboard.stripe.com/webhooks) and create a webhook:
   - Endpoint: `http://localhost:5000/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Webhook Secret** (starts with `whsec_`)

## Step 3: Configure Environment Variables

### Server (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/farm-rental
JWT_SECRET=your_jwt_secret_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Client (.env or .env.local)
```env
VITE_API_BASE_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Step 4: Database Updates

The `Booking` model has been updated with payment fields:
- `paymentMethod`: 'online' or 'cod'
- `paymentStatus`: 'pending', 'paid', or 'failed'
- `transactionId`: Stripe payment intent ID
- `paidAt`: Payment timestamp

Existing bookings will use defaults.

## Step 5: Start the Application

### Terminal 1 - Start Backend
```bash
cd d:\react_js_project\farmers\server
npm run dev
```

### Terminal 2 - Start Frontend
```bash
cd d:\react_js_project\farmers\client
npm run dev
```

## Step 6: Test the Payment Flow

### Farmer Booking Flow:
1. Login as a farmer user
2. Click "View Details" on any equipment
3. Select start and end dates
4. Choose payment option:
   - **💳 Pay Now (Online)** → Stripe payment form appears
   - **🏦 Pay on Delivery** → Booking confirmed, payment collected later
5. Complete the booking

### Stripe Test Cards:
Use these cards for testing (expires: any future date, CVC: any 3 digits):

| Card Type | Card Number | Status |
|-----------|------------|--------|
| Visa | 4242 4242 4242 4242 | Success |
| Visa (Auth) | 4000 0000 0000 3220 | Requires authentication |
| Declined | 4000 0000 0000 0002 | Declined |
| Insufficient Funds | 4000 0000 0000 9995 | Declined |

## Payment Flow Architecture

```
Farmer selects "Pay Now"
    ↓
Confirmation Modal shown
    ↓
Booking created on backend (status: pending)
    ↓
Stripe Payment Modal appears
    ↓
Farmer enters card details
    ↓
Payment Intent created via backend
    ↓
Stripe processes payment
    ↓
Backend confirms payment
    ↓
Booking marked as confirmed
    ↓
Equipment marked as unavailable
    ↓
Owner sees booking on dashboard
```

## Payment Status Flow

| Status | Description | Owner Visibility |
|--------|-------------|------------------|
| pending | Booking created, payment pending | ❌ Not shown yet |
| paid | Payment received (online) | ✅ Shows as "Confirmed" |
| confirmed | COD booking confirmed | ✅ Shows as "Pending Payment" |
| failed | Payment failed | ❌ Booking cancelled |

## API Endpoints

### Create Payment Intent
```
POST /api/payments/create-payment-intent
Headers: Authorization: Bearer {token}
Body: { bookingId, amount }
Response: { success, clientSecret, paymentIntentId }
```

### Confirm Payment
```
POST /api/payments/confirm-payment
Headers: Authorization: Bearer {token}
Body: { bookingId, paymentIntentId }
Response: { success, data: booking }
```

### Webhook
```
POST /api/payments/webhook
Headers: stripe-signature
Handles: payment_intent.succeeded, payment_intent.payment_failed
```

## Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS for all payment endpoints
- [ ] Set up email notifications for payment confirmations
- [ ] Add payment history page for farmers
- [ ] Implement payment refund mechanism
- [ ] Set up monitoring and alerts for failed payments

## Troubleshooting

### "STRIPE_SECRET_KEY is not defined"
- Check your `.env` file has `STRIPE_SECRET_KEY`
- Restart the server after updating `.env`

### "Payment intent not found"
- Check the booking ID is correct
- Verify the payment was created before confirmation

### "Invalid API Key"
- Get a fresh key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Ensure you're using test keys for development

### "Webhook signature verification failed"
- Get the webhook secret from [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
- Ensure it matches `STRIPE_WEBHOOK_SECRET`

## Next Steps

1. Implement payment history tracking
2. Add email notifications for confirmations
3. Create admin dashboard for payment analytics
4. Set up automated refund processing
5. Integrate SMS notifications
6. Add multiple payment methods (Apple Pay, Google Pay)

## Support

For Stripe documentation, visit: https://stripe.com/docs
For API reference: https://stripe.com/docs/api
