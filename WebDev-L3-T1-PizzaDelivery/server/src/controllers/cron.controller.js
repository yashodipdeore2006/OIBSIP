import { runLowStockCheck } from "../jobs/lowStock.job.js";
import {
  runPaymentReconciliation,
} from "../jobs/paymentReconciliation.job.js";

export const runMaintenance = async (
  req,
  res,
  next
) => {
  try {
    // Run reconciliation first so any newly-settled order stock changes
    // are visible to the low-stock check that follows.
    const payment = await runPaymentReconciliation();
    const lowStock = await runLowStockCheck();

    res.status(200).json({
      success: true,
      message: "Maintenance completed successfully.",
      results: {
        paymentReconciliation: payment,
        lowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};
