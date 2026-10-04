import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import ingredientRoutes from "./routes/ingredient.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes, {
  handleRazorpayWebhook,
} from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { globalRateLimiter } from "./middleware/rateLimit.middleware.js";
import { securityHeaders } from "./middleware/security.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

app.use(
  cors({
    origin: clientUrl,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(securityHeaders);
app.use(globalRateLimiter);

// Razorpay signs the raw request body. This must run before express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "200kb" }),
  handleRazorpayWebhook
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pizza Delivery API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/admin/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
