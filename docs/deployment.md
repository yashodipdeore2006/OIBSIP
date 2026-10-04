# Deployment Guide

## Architecture

The repository is a monorepo:

```text
WebDev-L3-T1-PizzaDelivery/
├── client/
└── server/
```

The current deployment model uses two Vercel projects:

```text
client → Vercel frontend
server → Vercel backend
```

## 1. MongoDB Atlas

Create a MongoDB Atlas cluster and database user.

Production environment variable:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

Allow the deployment environment to connect according to your Atlas network-access policy.

## 2. Backend on Vercel

Create a Vercel project using:

```text
Root Directory:
WebDev-L3-T1-PizzaDelivery/server
```

Use Node.js 22+.

The backend entrypoint is:

```text
server/src/index.js
```

The local long-running development server remains:

```text
server/src/server.js
```

## 3. Backend Environment Variables

Required production variables:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://<frontend-domain>

MONGO_URI=

JWT_SECRET=
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

CRON_SECRET=
```

Store secrets as Vercel Secret values. Never commit them.

## 4. Frontend on Vercel

Create another Vercel project using:

```text
Root Directory:
WebDev-L3-T1-PizzaDelivery/client
```

Vite build:

```text
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Frontend variables:

```env
VITE_API_URL=https://<backend-domain>/api
VITE_SOCKET_URL=https://<backend-domain>
```

`VITE_*` variables are exposed to the browser. Never put secrets in them.

## 5. CORS

The backend must allow the exact frontend origin:

```env
CLIENT_URL=https://<frontend-domain>
```

Do not include a trailing slash unless the backend code explicitly expects it.

## 6. Razorpay Webhook

After the backend has a public production URL, configure Razorpay Test Mode:

```text
https://<backend-domain>/api/payments/webhook
```

The webhook secret must match:

```env
RAZORPAY_WEBHOOK_SECRET=
```

The backend validates the webhook signature before processing events.

## 7. Scheduling

Local/server deployment:

```text
low stock → node-cron every 30 minutes
payment reconciliation → node-cron every 15 minutes
```

For Vercel Hobby, use the scheduled maintenance endpoint as a fallback and rely on Razorpay webhooks for near-real-time payment events. Do not assume a long-running `node-cron` process survives across serverless invocations.

Maintenance endpoint:

```text
GET /api/cron/maintenance
Authorization: Bearer <CRON_SECRET>
```

## 8. Deployment Checklist

Before going live:

- MongoDB Atlas URI works
- Atlas network access allows the deployment
- Backend `/api/health` returns HTTP 200
- `CLIENT_URL` matches the frontend origin
- Frontend `VITE_API_URL` points to the production backend
- Razorpay is configured in the intended mode
- Razorpay webhook is configured
- Gmail SMTP App Password works
- No `.env` files are committed
- Test registration and email verification
- Test login
- Test pizza creation
- Test payment
- Test inventory decrement
- Test admin order status updates
- Test real-time order updates
