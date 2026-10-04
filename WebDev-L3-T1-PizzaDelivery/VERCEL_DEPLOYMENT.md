# Pizza Delivery — Vercel Deployment

This repository can be deployed as two Vercel projects:

1. Frontend root:
   `WebDev-L3-T1-PizzaDelivery/client`

2. Backend root:
   `WebDev-L3-T1-PizzaDelivery/server`

## Backend

Vercel uses:

- `src/index.js` as the HTTP/Express + Socket.IO entry point
- MongoDB lazy connection for serverless/Fluid Compute
- `/api/cron/maintenance` as the daily maintenance endpoint
- `vercel.json` to register the daily Cron Job

The existing `src/server.js` remains the local-development server and keeps the existing
30-minute and 15-minute node-cron schedules for normal local/server deployments.

### Required backend environment variables

Set these in Vercel Project Settings -> Environment Variables:

`NODE_ENV=production`

`CLIENT_URL=<your deployed frontend URL>`

`MONGO_URI=<MongoDB Atlas URI>`

`JWT_SECRET=<strong random secret>`

`JWT_EXPIRES_IN=7d`

`SMTP_HOST=smtp.gmail.com`

`SMTP_PORT=465`

`SMTP_SECURE=true`

`SMTP_USER=<gmail address>`

`SMTP_PASSWORD=<gmail app password>`

`EMAIL_FROM=Pizza Delivery <gmail address>`

`RAZORPAY_KEY_ID=<Razorpay test key id>`

`RAZORPAY_KEY_SECRET=<Razorpay test key secret>`

`RAZORPAY_WEBHOOK_SECRET=<Razorpay webhook secret>`

`CRON_SECRET=<strong random secret>`

Do not commit `.env`.

## Frontend

Set:

`VITE_API_URL=<backend vercel URL>/api`

`VITE_SOCKET_URL=<backend vercel URL>`

Then deploy the Vite app.

## Important Hobby-plan limitation

Vercel Hobby Cron Jobs can run only once per day. Therefore the old local:

- low-stock: every 30 minutes
- payment reconciliation: every 15 minutes

must not be registered as Vercel cron schedules.

The production architecture uses Razorpay webhooks for near-real-time payment events and the
single daily maintenance endpoint as a fallback/recovery check.

## SPA routing

`client/vercel.json` rewrites all frontend routes to `/index.html`, which is required for
React Router browser routes such as:

- `/login`
- `/register`
- `/pizza-builder`
- `/my-orders`
- `/admin`
- `/admin/inventory`
- `/admin/orders`

## Socket.IO

Vercel now supports WebSocket connections for Node.js Functions. Socket.IO is supported too.

WebSocket connections are pinned to a Vercel Function instance. For reliable cross-instance
delivery when the application scales horizontally, use a Redis-backed Socket.IO adapter.

The current code keeps Socket.IO functional without Redis for simpler/low-traffic deployments.
