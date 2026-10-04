# PizzaCraft — Custom Pizza Delivery & Inventory Platform

PizzaCraft is a production-style MERN application for building custom pizzas, accepting Razorpay payments, managing inventory, and tracking orders in real time.

## Stack

- React 19 + Vite
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication
- Razorpay test payments
- Socket.IO real-time order tracking
- Nodemailer email delivery
- node-cron low-stock and payment reconciliation jobs

## Core features

### Customer

- Registration with email verification
- Login with JWT authentication
- Forgot/reset password
- Five-step custom pizza builder
- Server-side price calculation
- Inventory-aware selections
- Razorpay checkout
- Reusable pending-order payment retry
- Order history
- Live order status tracking

### Admin

- Separate admin console
- Dashboard metrics
- Inventory search/filter/update
- Low-stock visibility
- Order filtering by payment/order status
- Payment/failure visibility
- Controlled order-status transitions

## Architecture

```text
React / Vite
    │
    ├── REST API ───────────────┐
    │                           ▼
    └── Socket.IO          Express API
                              │
                 ┌────────────┼─────────────┐
                 ▼            ▼             ▼
             MongoDB       Razorpay     Nodemailer
                 │            │             │
                 └──────┬─────┴─────────────┘
                        ▼
                 node-cron jobs
              low-stock / reconciliation
```

## Project structure

```text
WebDev-L3-T1-PizzaDelivery/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── sockets/
│   └── package.json
└── README.md
```

## Local setup

### 1. Clone and enter the project

```bash
git clone https://github.com/yashodipdeore2006/OIBSIP.git
cd OIBSIP/WebDev-L3-T1-PizzaDelivery
```

### 2. Backend environment

```bash
cd server
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Set:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/pizza_delivery
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=Pizza Delivery <your_email@example.com>

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Then:

```bash
npm ci
npm run dev
```

### 3. Frontend environment

In another terminal:

```bash
cd ../client
copy .env.example .env
npm ci
npm run dev
```

Use `cp` instead of `copy` on macOS/Linux.

## Admin access

Register a normal account first. After the account is verified, change its MongoDB `role` field from `user` to `admin` in MongoDB Compass. Log out and log in again so the newly issued JWT contains the admin role.

No admin-creation script is required.

## Payment lifecycle

```text
Create internal order
      │
      ▼
Create/reuse Razorpay order
      │
      ▼
Open Razorpay Checkout
      │
  ┌───┴─────────────┐
  │                 │
Success          Cancel/fail
  │                 │
  ▼                 ▼
Verify signature   Keep internal order pending/failed
  │                 │
  ▼                 ▼
Atomic stock       Retry same order
decrement
  │
  ▼
Mark paid
```

The server also processes Razorpay webhooks and periodically reconciles recent pending/failed payments with Razorpay. A captured payment that cannot be fulfilled because required stock is unavailable is marked `refund_required` for manual refund handling.

## Razorpay webhook

Configure Razorpay to send payment events to:

```text
https://YOUR-API-DOMAIN/api/payments/webhook
```

Use the same value configured as `RAZORPAY_WEBHOOK_SECRET` in the API environment.

Recommended events for this implementation:

- `payment.captured`
- `payment.failed`
- `order.paid`

The endpoint validates the raw webhook body with the Razorpay webhook secret.

## API endpoints

### Auth

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/verify-email?token=...` | Verify email |
| POST | `/api/auth/forgot-password` | Start reset |
| POST | `/api/auth/reset-password?token=...` | Reset password |

### Ingredients

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/ingredients` | List ingredients |
| GET | `/api/ingredients/:category` | Filter by category |

### Orders

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/orders` | Create pending order |
| GET | `/api/orders/my-orders` | Current user's orders |
| GET | `/api/orders/admin` | Admin order list |
| PATCH | `/api/orders/admin/:id/status` | Advance order status |

### Payments

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/payments/create-order` | Create/reuse gateway order |
| POST | `/api/payments/verify` | Verify checkout signature |
| POST | `/api/payments/webhook` | Razorpay server webhook |

### Admin

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Dashboard metrics |
| GET | `/api/admin/inventory` | Inventory |
| POST | `/api/admin/inventory` | Add ingredient |
| PATCH | `/api/admin/inventory/:id` | Update ingredient |
| DELETE | `/api/admin/inventory/:id` | Delete ingredient |

## Production hardening included

- Restricted CORS from `CLIENT_URL`
- Security response headers
- HSTS in production
- Request-body size limit
- Global rate limiting
- Stricter auth rate limiting
- Request validation for IDs and bodies
- Centralized 404/error handling
- Disabled `X-Powered-By`
- Timing-safe payment signature comparison
- Atomic payment/inventory settlement
- Idempotent payment settlement
- Webhook signature verification
- Payment reconciliation job
- Graceful server shutdown
- Environment-based frontend API and Socket.IO URLs

The custom rate limiter is process-local. For a horizontally scaled deployment, replace it with a shared store such as Redis so limits are consistent across instances.

## Deployment with Render

`render.yaml` in the repository root describes:

1. Node web service for the API.
2. Static site for the React client.
3. React Router rewrite to `/index.html`.
4. Health-check configuration.
5. Secret environment variables supplied through the Render Dashboard rather than committed to Git.

After deployment, set:

```env
CLIENT_URL=https://YOUR-FRONTEND-DOMAIN
VITE_API_URL=https://YOUR-API-DOMAIN/api
VITE_SOCKET_URL=https://YOUR-API-DOMAIN
```

Razorpay should use production HTTPS URLs for a production deployment. Never put `RAZORPAY_KEY_SECRET`, JWT secrets, SMTP passwords or webhook secrets into frontend variables.

## Verification checklist

- [ ] Register a customer
- [ ] Verify email
- [ ] Login
- [ ] Build a pizza
- [ ] Create an order
- [ ] Complete Razorpay test payment
- [ ] Confirm stock decrement
- [ ] Confirm order appears in My Orders
- [ ] Change order status as admin
- [ ] Confirm Socket.IO live update
- [ ] Simulate/cancel a payment and retry the same order
- [ ] Configure and test Razorpay webhook
- [ ] Confirm low-stock email job
- [ ] Run `npm run build` for the client before deployment
- [ ] Confirm `/api/health` after deployment

## License

ISC
