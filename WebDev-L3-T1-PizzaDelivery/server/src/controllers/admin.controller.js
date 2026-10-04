import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";

export const getAdminDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      paidOrders,
      pendingPayments,
      totalIngredients,
      lowStockIngredients,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: "pending" }),
      Ingredient.countDocuments(),
      Ingredient.countDocuments({
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        paidOrders,
        pendingPayments,
        totalIngredients,
        lowStockIngredients,
        totalRevenue: revenueResult[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
