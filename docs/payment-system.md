# Payment System - AKADEMO

## Overview
AKADEMO now supports class payments with three methods:
1. **Cash Payment** - Manual approval by academy (implemented)
2. **Stripe Connect** - Direct card payments to academy (pending setup)
3. **Bizum** - Spanish bank transfer via Stripe (pending setup)

---

## Current Implementation

### Database Schema

**ClassEnrollment table additions:**
```sql
ALTER TABLE ClassEnrollment ADD COLUMN paymentStatus TEXT DEFAULT 'PENDING';
  -- PENDING: No payment initiated
  -- CASH_PENDING: Student claimed cash payment, waiting for academy approval
  -- PAID: Payment confirmed

ALTER TABLE ClassEnrollment ADD COLUMN paymentMethod TEXT DEFAULT NULL;
  -- cash, stripe, bizum

ALTER TABLE ClassEnrollment ADD COLUMN paymentId TEXT DEFAULT NULL;
  -- Reference to Payment.id for Stripe/Bizum

ALTER TABLE ClassEnrollment ADD COLUMN paymentAmount REAL DEFAULT 0;
  -- Amount paid

ALTER TABLE Class ADD COLUMN price REAL DEFAULT 0;
  -- Class price set by academy

ALTER TABLE Class ADD COLUMN currency TEXT DEFAULT 'EUR';
  -- Currency (EUR for Spain)

ALTER TABLE Academy ADD COLUMN stripeAccountId TEXT DEFAULT NULL;
  -- Stripe Connect account ID (for future use)
```

### Payment Flow

**Student Side:**
1. Student enrolls in class
2. Tries to access class → PaymentModal appears if `paymentStatus !== 'PAID'`
3. Selects payment method:
   - **Cash**: Marks as CASH_PENDING → waits for academy approval
   - **Stripe/Bizum**: Not yet implemented (shows "Próximamente")
4. After payment approved → DocumentSigningModal appears
5. After document signed → access granted

**Academy Side:**
1. Navigate to **Dashboard → Pagos**
2. See list of pending cash payments
3. Approve or reject each payment
4. Approved → student can access class
5. Rejected → student must retry payment

### API Endpoints

**POST `/payments/initiate`**
- Student initiates payment
- Body: `{ classId, paymentMethod: 'cash' | 'stripe' | 'bizum' }`
- Cash: Updates to CASH_PENDING
- Stripe/Bizum: Returns 501 (not implemented)

**GET `/payments/pending-cash`**
- Academy/Teacher views pending cash payments
- Returns: enrollmentId, student info, class info, amount, date

**PATCH `/payments/:enrollmentId/approve-cash`**
- Academy approves/rejects cash payment
- Body: `{ approved: true | false }`
- Approved: CASH_PENDING → PAID
- Rejected: CASH_PENDING → PENDING

**POST `/webhooks/stripe`**
- Stripe webhook for payment confirmations
- Handles `checkout.session.completed` event
- Updates enrollment status to PAID

---

## Stripe Connect Setup (Pending)

### What is Stripe Connect?
Stripe Connect allows academies to receive payments directly to their Stripe account, with AKADEMO taking a platform fee (e.g., 5%).

### Setup Steps

#### 1. Create Stripe Account
- Sign up at https://stripe.com
- Complete KYC verification
- Get API keys from Dashboard → Developers → API keys

#### 2. Configure Cloudflare Workers Secrets
```powershell
# Add Stripe secret key
echo "sk_live_xxxx" | npx wrangler secret put STRIPE_SECRET_KEY

# Add webhook secret (after creating webhook)
echo "whsec_xxxx" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

#### 3. Enable Stripe Connect
- Go to Stripe Dashboard → Settings → Connect
- Enable "Custom" platform mode
- Configure branding and onboarding

#### 4. Create Connected Accounts
Each academy needs a Stripe Connect account:

```typescript
// workers/akademo-api/src/routes/academies.ts
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

// When academy signs up or enables payments
const account = await stripe.accounts.create({
  type: 'express', // Simplified onboarding
  country: 'ES',
  email: academyOwnerEmail,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'individual', // or 'company'
});

// Save account.id to Academy.stripeAccountId
await c.env.DB.prepare(
  'UPDATE Academy SET stripeAccountId = ? WHERE id = ?'
).bind(account.id, academyId).run();

// Create onboarding link for academy owner
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${c.env.FRONTEND_URL}/dashboard/academy/settings`,
  return_url: `${c.env.FRONTEND_URL}/dashboard/academy/settings?onboarding=complete`,
  type: 'account_onboarding',
});

// Redirect academy owner to accountLink.url to complete setup
```

#### 5. Create Checkout Session (Implement in payments.ts)
```typescript
// POST /payments/stripe-session
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card', 'bizum'], // Bizum available in Spain
  line_items: [{
    price_data: {
      currency: classData.currency || 'eur',
      product_data: {
        name: classData.name,
        description: `Acceso a la clase ${classData.name}`,
      },
      unit_amount: Math.round(classData.price * 100), // Convert to cents
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${c.env.FRONTEND_URL}/dashboard/student/classes?payment=success`,
  cancel_url: `${c.env.FRONTEND_URL}/dashboard/student/classes?payment=cancel`,
  metadata: {
    classId,
    userId: session.id,
    enrollmentId: enrollment.id,
    academyId: classData.academyId,
  },
  payment_intent_data: {
    application_fee_amount: Math.round(classData.price * 100 * 0.05), // 5% platform fee
    transfer_data: {
      destination: classData.stripeAccountId, // Academy's Stripe Connect account
    },
  },
});

return c.json(successResponse({ url: session.url }));
```

#### 6. Setup Webhook
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://akademo-api.alexxvives.workers.dev/webhooks/stripe`
- Select events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy signing secret → add to Workers secrets

#### 7. Test Mode
Use Stripe test keys for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

---

## Bizum Integration

### What is Bizum?
Bizum is a Spanish instant payment system integrated with most Spanish banks. In Stripe, it's available as a payment method for Spain.

### Setup
1. Ensure Stripe account is based in Spain (`country: 'ES'`)
2. Enable Bizum in Stripe Dashboard → Settings → Payment methods
3. Add 'bizum' to `payment_method_types` in checkout session:
   ```typescript
   payment_method_types: ['card', 'bizum']
   ```
4. That's it! Stripe handles the rest.

### User Experience
1. Student clicks "Bizum" option
2. Redirected to Stripe Checkout
3. Selects Bizum as payment method
4. Enters phone number linked to bank account
5. Confirms payment in banking app
6. Instant payment → access granted

---

## Frontend Implementation

### PaymentModal Component
Located: `src/components/PaymentModal.tsx`

**Features:**
- Shows 3 payment options (Cash, Stripe, Bizum)
- Cash: Confirmation dialog → calls `/payments/initiate`
- Stripe/Bizum: Disabled with "Próximamente" badge
- Currency formatting with Intl.NumberFormat

**Usage:**
```tsx
<PaymentModal
  isOpen={!!payingClass}
  onClose={() => setPayingClass(null)}
  classId={classId}
  className={className}
  price={price}
  currency="EUR"
  onPaymentComplete={() => {
    loadData(); // Refresh enrollment status
  }}
/>
```

### Academy Payments Page
Located: `src/app/dashboard/academy/payments/page.tsx`

**Features:**
- List of pending cash payments
- Student info (name, email, class, amount, date)
- Approve/reject buttons
- Stats: pending count, total amount
- Real-time updates

---

## Testing

### Cash Payment Flow
1. Create student account
2. Enroll in a class with price > 0
3. Try to access class → PaymentModal appears
4. Select "Pago en Efectivo"
5. Confirm → status changes to CASH_PENDING
6. Switch to academy account
7. Go to Dashboard → Pagos
8. See pending payment
9. Approve → student can access class

### Database Verification
```powershell
npx wrangler d1 execute akademo-db --remote --command "SELECT id, paymentStatus, paymentMethod, paymentAmount FROM ClassEnrollment WHERE paymentStatus = 'CASH_PENDING'"
```

---

## Migration Commands

### Apply Migration
```powershell
npx wrangler d1 execute akademo-db --remote --file=migrations/0019_enrollment_payments.sql
```

### Verify Schema
```powershell
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(ClassEnrollment)"
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(Class)"
npx wrangler d1 execute akademo-db --remote --command "PRAGMA table_info(Academy)"
```

---

## Security Considerations

### Webhook Signature Verification
Always verify Stripe webhook signatures:
```typescript
const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
const sig = c.req.header('stripe-signature');

try {
  const event = stripe.webhooks.constructEvent(
    await c.req.text(),
    sig,
    c.env.STRIPE_WEBHOOK_SECRET
  );
  // Process event
} catch (err) {
  return c.json(errorResponse('Invalid signature'), 400);
}
```

### Payment Amount Validation
Never trust frontend payment amounts. Always use server-side class price:
```typescript
const classData = await c.env.DB
  .prepare('SELECT price FROM Class WHERE id = ?')
  .bind(classId)
  .first();

// Use classData.price, NOT request body amount
```

---

## Future Enhancements

1. **Subscription Payments**
   - Monthly/annual class subscriptions
   - Stripe Subscription API
   - Auto-renewal with grace period

2. **Refunds**
   - Student requests refund
   - Academy approves
   - Automatic Stripe refund processing

3. **Payment History**
   - Student: View all payments
   - Academy: Export payment reports
   - Admin: Platform-wide payment analytics

4. **Multiple Classes Checkout**
   - Student buys multiple classes at once
   - Single Stripe checkout session
   - Bulk discount support

5. **Alternative Payment Methods**
   - PayPal integration
   - Bank transfer (SEPA for Spain)
   - Cryptocurrency (experimental)

---

## Troubleshooting

### "Stripe Connect not yet configured" Error
**Cause**: Academy doesn't have `stripeAccountId` set
**Fix**: Academy must complete Stripe Connect onboarding first

### Payment Status Stuck at CASH_PENDING
**Cause**: Academy hasn't approved/rejected yet
**Fix**: Academy goes to Dashboard → Pagos → approve payment

### Webhook Not Receiving Events
**Cause**: Incorrect webhook URL or secret
**Fix**: Verify webhook URL in Stripe Dashboard matches deployed worker URL

---

## Documentation References

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Bizum Payment Method](https://stripe.com/docs/payments/bizum)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

---

**Last Updated**: January 21, 2026  
**Status**: Cash payments implemented, Stripe Connect pending configuration
