import express from "express";
import cors from "cors";

import authRoutes from './routes/auth.routes.js';
import ingredientRoutes from "./routes/ingredient.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";

//------ App -----
const app = express();


//------ Middlewares-----------
app.use(cors());
app.use(express.json());

//========= Routers ========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "Pizza Delivery API is running"
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/ingredients", ingredientRoutes);

app.use("/api/admin/inventory", inventoryRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/admin", adminRoutes);


//==============================
export default app;
