# Late Joiner Billing & Payment System Enhancements

**Date:** January 2026  
**Status:** ✅ Deployed (API: 38069768-6bd8-4263-b7da-d441b6fce0ea)

---

## Overview

Implemented three major payment system enhancements:
1. **Late Joiner Catch-Up Billing** - Charge students for all missed monthly cycles
2. **Payment Deletion** - Fixed DELETE endpoint for academy admins
3. **Compact Payment Cards** - Redesigned payment history UI with class names

---

## 1. Late Joiner Catch-Up Billing

### Problem
Previously, students joining after class start date only paid for the next billing cycle, getting the current cycle free. This caused revenue loss for academies.

### Solution
Modified billing calculation to charge for **ALL missed cycles** immediately:

**Example:**
- Class started: January 1, 2026
- Student joins: March 15, 2026 (75 days later = 2.5 cycles)
- **OLD**: Charge 1 month (€50)
- **NEW**: Charge 3 months (€150) - Jan, Feb, Mar cycles + current partial

### Implementation

**File: `workers/akademo-api/src/routes/payments.ts`**

**Updated Function Signature:**
```typescript
function calculateBillingCycle(
  classStartDate: string,
  enrollmentDate: string,
  isMonthly: boolean,
  monthlyPrice: number // NEW PARAMETER
): {
  billingCycleStart: string;
  billingCycleEnd: string;
  nextPaymentDue: string;
  missedCycles: number;        // NEW FIELD
  catchUpAmount: number;       // NEW FIELD
  totalAmount: number;         // NEW FIELD
}
```

**Calculation Logic:**
```typescript
// Calculate days since class started
const daysSinceStart = Math.floor((now.getTime() - classStart.getTime()) / (1000 * 60 * 60 * 24));

// Calculate number of 30-day cycles that have passed
const currentCycleNumber = Math.floor(daysSinceStart / 30);

// Missed cycles = all previous cycles + current cycle
const missedCycles = isMonthly ? currentCycleNumber + 1 : 0;

// Calculate catch-up amount
const catchUpAmount = missedCycles * monthlyPrice;

// Total to charge now
const totalAmount = isMonthly ? catchUpAmount : monthlyPrice;
```

**Metadata Storage:**
```json
{
  "missedCycles": 3,
  "catchUpAmount": 150,
  "regularPrice": 50,
  "note": "Incluye 3 ciclo(s) pendiente(s). Próximos pagos serán de 50€/mes."
}
```

### User Experience

**Payment Confirmation Message:**
```
"Solicitud enviada. Total: 150€ (incluye 3 mes(es) pendiente(s)). Próximos pagos: 50€/mes."
```

This ensures students understand:
- Why they're paying more now
- What future payments will be
- Transparency in billing

---

## 2. Payment Deletion

### Problem
DELETE endpoint existed but had bugs:
- Queried wrong table (ClassEnrollment instead of Payment)
- Used undefined variable (`paymentId` instead of parameter)
- Could not delete payment records

### Solution

**File: `workers/akademo-api/src/routes/payments.ts` (line 1011-1050)**

**Fixed Query:**
```typescript
// OLD - WRONG
SELECT e.*, c.academyId, a.ownerId
FROM ClassEnrollment e  // ❌ Wrong table
WHERE e.id = ?

// NEW - CORRECT
SELECT p.*, c.academyId, a.ownerId
FROM Payment p  // ✅ Correct table
LEFT JOIN Class c ON p.classId = c.id
WHERE p.id = ?
```

**Fixed Variable:**
```typescript
// OLD - WRONG
const enrollmentId = c.req.param('id');  // ❌ Wrong name
await DB.prepare('DELETE FROM Payment WHERE id = ?').bind(paymentId); // ❌ Undefined

// NEW - CORRECT
const paymentId = c.req.param('id');  // ✅ Correct name
await DB.prepare('DELETE FROM Payment WHERE id = ?').bind(paymentId); // ✅ Defined
```

**Permissions:**
- Only `ACADEMY` (academy owner) or `ADMIN` can delete
- Verifies ownership via `Academy.ownerId`

**Endpoint:**
```
DELETE /payments/:id
Authorization: academy_session cookie
Response: { success: true, data: { message: "Payment deleted successfully" } }
```

---

## 3. Compact Payment Cards

### Problem
Payment history cards were too tall, didn't show class name, wasted space.

### Solution

**File: `src/components/shared/StudentPaymentDetailModal.tsx`**

**OLD Design (Vertical, ~80px height):**
```tsx
<div className="p-4">
  <div className="mb-3">
    <span>Mes 1</span>
    <span>Status Badge</span>
    <div className="text-lg">€50</div>
  </div>
  <div className="flex gap-3">
    <span>💳 Efectivo</span>
    <span>1 de enero de 2026</span>
  </div>
</div>
```

**NEW Design (Horizontal, ~40px height):**
```tsx
<div className="px-4 py-2.5 flex items-center justify-between gap-4">
  <!-- Left: Status & Method -->
  <div className="flex gap-2">
    <StatusBadge />
    <PaymentIcon /> Efectivo
  </div>
  
  <!-- Center: Class Name & Date -->
  <div className="flex flex-col items-center">
    <span className="font-semibold">Matemáticas 101</span>
    <span className="text-xs">1 de enero de 2026</span>
  </div>
  
  <!-- Right: Month & Amount -->
  <div className="flex gap-3">
    <span className="bg-blue-50">M1</span>
    <span className="font-bold">€50</span>
  </div>
</div>
```

**Benefits:**
- **50% shorter** - Fits more payments in viewport
- **Class name visible** - Clear payment context
- **Better UX** - Information scanned left-to-right
- **Responsive** - Adapts to different screen sizes

---

## Testing

### Test Late Joiner Billing

1. Create class with start date in the past (e.g., 60 days ago)
2. Enroll student now
3. Initiate monthly payment
4. **Expected**: Student charged for 3 months (60 days ÷ 30 = 2 cycles + 1 current)
5. **Message**: "Total: €150 (incluye 3 mes(es) pendiente(s)). Próximos pagos: €50/mes."

### Test Payment Deletion

1. Login as academy owner
2. Go to Pagos (Payments) page
3. Click "Eliminar" button on a COMPLETED payment
4. Confirm deletion
5. **Expected**: Payment removed, lists refreshed

### Test Compact Cards

1. Login as academy owner
2. Open student payment history modal
3. **Expected**: Cards are ~50% shorter with class name visible

---

## Database Changes

No schema changes required. Uses existing columns:
- `Payment.metadata` (JSON) - Stores missedCycles, catchUpAmount, regularPrice
- `Payment.amount` - Stores totalAmount (catch-up + current cycle)
- `Payment.nextPaymentDue` - Next regular payment date
- `Payment.billingCycleStart` - Always class start date for late joiners
- `Payment.billingCycleEnd` - End of current billing cycle

---

## API Changes Summary

### Modified Endpoints

**POST /payments/initiate**
- Now passes `monthlyPrice` to `calculateBillingCycle`
- Uses `billingCycle.totalAmount` instead of `price`
- Stores catch-up info in metadata
- Returns `missedCycles` and `catchUpAmount` in response

**DELETE /payments/:id**
- Fixed query to use Payment table (not ClassEnrollment)
- Fixed variable name (`paymentId` instead of `enrollmentId`)
- Proper permission checks (ACADEMY owner or ADMIN)

### Modified Functions

**calculateBillingCycle()**
- Added 4th parameter: `monthlyPrice: number`
- Returns 3 new fields: `missedCycles`, `catchUpAmount`, `totalAmount`
- Late joiners: `billingCycleStart` = class start (not next cycle)

---

## Future Enhancements

1. **Prorated First Month** (optional):
   - Instead of charging full month, prorate by days remaining
   - Example: Joining on day 15 of cycle → charge 50% of month

2. **Catch-Up Payment Plan** (optional):
   - Spread catch-up amount over multiple payments
   - Example: €150 catch-up → €75 now + €75 next month

3. **Stripe Integration**:
   - Pass catch-up amount to Stripe Checkout
   - Add line items for each missed cycle
   - Update webhook handler to process catch-up metadata

4. **Email Notifications**:
   - Send breakdown of catch-up charges
   - Explain billing cycle calculation
   - Confirm next regular payment amount

---

## Deployment Info

**API Worker:**
- Version: 38069768-6bd8-4263-b7da-d441b6fce0ea
- Deployed: January 2026
- URL: https://akademo-api.alexxvives.workers.dev

**Frontend Worker:**
- Pending deployment (needs `npx @opennextjs/cloudflare build && npx wrangler deploy`)

**Files Changed:**
1. `workers/akademo-api/src/routes/payments.ts` (calculateBillingCycle, initiate, DELETE)
2. `src/components/shared/StudentPaymentDetailModal.tsx` (card redesign)
3. `src/app/dashboard/academy/payments/page.tsx` (delete button - already deployed)

---

**Status:** ✅ Ready for testing
**Next Steps:** Deploy frontend, test all three features
