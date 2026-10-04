import "dotenv/config";

import http from "node:http";

import app from "./app.js";
import connectDB from "./config/database.js";
import { startLowStockJob } from "./jobs/lowStock.job.js";
import {
  startPaymentReconciliationJob,
} from "./jobs/paymentReconciliation.job.js";
import { attachSocketServer } from "./sockets/index.js";

const PORT = Number(process.env.PORT || 5000);

const httpServer = http.createServer(app);

attachSocketServer(httpServer);

const startServer = async () => {
  try {
    await connectDB();

    // These long-lived schedulers are for local/server deployments.
    // Vercel uses the /api/cron/maintenance endpoint instead.
    startLowStockJob();
    startPaymentReconciliationJob();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

const shutdown = (signal) => {
  console.log(
    `${signal} received. Closing HTTP server...`
  );

  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
