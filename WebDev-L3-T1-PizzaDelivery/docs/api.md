# API Documentation

Base URL (local):

```text
http://localhost:5000/api
```

Production:

```text
https://<your-backend-domain>/api
```

## Authentication

Authenticated endpoints expect:

```http
Authorization: Bearer <JWT>
```

## Auth Endpoints

### Register

```http
POST /auth/register
```

Body:

```json
{
  "name": "Yashodip Deore",
  "email": "user@example.com",
  "password": "strong-password"
}
```

Creates an unverified user and sends an email-verification link.

### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

Returns a JWT and user information.

### Current User

```http
GET /auth/me
```

Requires authentication.

### Verify Email

```http
GET /auth/verify-email?token=<token>
```

### Forgot Password

```http
POST /auth/forgot-password
```

Body:

```json
{
  "email": "user@example.com"
}
```

### Reset Password

```http
POST /auth/reset-password?token=<token>
```

Body:

```json
{
  "password": "new-password"
}
```

## Ingredients

### List Ingredients

```http
GET /ingredients
```

Returns the ingredient catalog.

### Filter by Category

```http
GET /ingredients?category=base
```

The exact query behavior should follow the deployed route/controller implementation.

## Orders

### Create Order

```http
POST /orders
```

Requires authentication.

Body:

```json
{
  "baseId": "<ingredientId>",
  "sauceId": "<ingredientId>",
  "cheeseId": "<ingredientId>",
  "vegetableIds": ["<ingredientId>"]
}
```

The server:

- validates ingredient existence
- validates categories
- validates stock
- calculates the authoritative price
- creates a pending order

### My Orders

```http
GET /orders/my
```

Requires authentication.

### Admin Orders

```http
GET /admin/orders
```

Requires admin authentication.

### Update Order Status

```http
PATCH /admin/orders/:id/status
```

Typical body:

```json
{
  "orderStatus": "in_kitchen"
}
```

Allowed order status progression:

```text
received
→ in_kitchen
→ sent_to_delivery
```

## Payments

### Create Razorpay Order

```http
POST /payments/create-order
```

Requires authentication.

Body:

```json
{
  "orderId": "<orderId>"
}
```

### Verify Payment

```http
POST /payments/verify
```

Requires authentication.

Body contains Razorpay's:

```json
{
  "orderId": "<orderId>",
  "razorpay_order_id": "<razorpayOrderId>",
  "razorpay_payment_id": "<razorpayPaymentId>",
  "razorpay_signature": "<signature>"
}
```

### Razorpay Webhook

```http
POST /payments/webhook
```

Public webhook endpoint secured by the Razorpay webhook signature.

The server handles payment-related events including:

```text
payment.captured
payment.failed
order.paid
```

## Admin Inventory

### List Inventory

```http
GET /admin/inventory
```

### Create Ingredient

```http
POST /admin/inventory
```

Example:

```json
{
  "name": "Mozzarella",
  "category": "cheese",
  "price": 79,
  "stock": 50,
  "lowStockThreshold": 10
}
```

### Update Ingredient

```http
PATCH /admin/inventory/:id
```

Example:

```json
{
  "stock": 75
}
```

### Delete Ingredient

```http
DELETE /admin/inventory/:id
```

## Health Check

```http
GET /health
```

Expected response:

```json
{
  "success": true,
  "message": "Pizza Delivery API is running"
}
```

## Error Shape

Typical errors return:

```json
{
  "success": false,
  "message": "Error description"
}
```

Production responses intentionally avoid exposing internal exception details for 5xx errors.
