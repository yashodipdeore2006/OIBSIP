# OIBSIP

OIBSIP/
└── WebDev-L3-T1-PizzaDelivery/
│
├── client/
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── ...
│
├── server/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── services/
│ │ ├── jobs/
│ │ ├── sockets/
│ │ ├── utils/
│ │ ├── app.js
│ │ └── server.js
│ │
│ ├── .env.example
│ └── package.json
│
├── README.md
└── .gitignore

                    ┌──────────────────────────┐
                    │      React Frontend      │
                    │                          │
                    │  User App   Admin Panel  │
                    └────────────┬─────────────┘
                                 │ REST API
                                 │ WebSocket
                                 ▼
                    ┌──────────────────────────┐
                    │    Node + Express API    │
                    │                          │
                    │ Auth │ Pizza │ Orders    │
                    │ Inventory │ Payments     │
                    └───────┬──────────┬───────┘
                            │          │
                ┌───────────▼──┐   ┌──▼───────────┐
                │   MongoDB    │   │   Services   │
                │              │   │              │
                │ Users        │   │ Razorpay     │
                │ Products     │   │ Nodemailer   │
                │ Orders       │   │ node-cron    │
                │ Inventory    │   │ Socket.IO    │
                └──────────────┘   └──────────────┘

21. Build it in these exact milestones

Don't jump around.

**Milestone 1 — Foundation**
Git repository
React/Vite
Express
MongoDB
Environment variables
CORS
Error handling
Basic API structure

**Milestone 2 — Authentication**
User registration
Password hashing
Login
JWT
Authentication middleware
Email verification
Forgot password
Reset password

**Milestone 3 — Pizza catalog**
Ingredient model
Ingredient API
Pizza dashboard
Base selection
Sauce selection
Cheese selection
Vegetable selection
Price calculation

**Milestone 4 — Orders**
Order model
Order creation
Order history
Order details
Server-side price calculation
Stock validation
Stock decrement

**Milestone 5 — Admin**
Admin login
Admin middleware
Dashboard
Inventory
Manual stock update
Order management

**Milestone 6 — Payments**
Razorpay test account
Create payment order
Checkout
Payment verification
Payment status
Failed payment handling

**Milestone 7 — Real-time**
Socket.IO server
Socket.IO client
User rooms
Admin status updates
User live status updates

**Milestone 8 — Automation**
node-cron
Low-stock detection
Nodemailer
Admin email
Duplicate-alert prevention

**Milestone 9 — Production hardening**
Centralized error handling
Input validation
Rate limiting
Security headers
Logging
API documentation
.env.example
README
Deployment

#### **API structure**

/api
│
├── /auth
│ ├── POST /register
│ ├── POST /login
│ ├── POST /verify-email
│ ├── POST /forgot-password
│ └── POST /reset-password
│
├── /ingredients
│ ├── GET /
│ └── GET /:id
│
├── /orders
│ ├── POST /
│ ├── GET /
│ └── GET /:id
│
├── /payments
│ ├── POST /create-order
│ └── POST /verify
│
└── /admin
│
├── /orders
│ ├── GET /
│ └── PATCH /:id/status
│
└── /inventory
├── GET /
├── POST /
└── PATCH /:id
