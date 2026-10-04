import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";

export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      paidOrders,
      pendingPayments,
      totalIngredients,
      lowStockIngredients,
    ] = await Promise.all([
      Order.countDocuments(),

      Order.countDocuments({
        paymentStatus: "paid",
      }),

      Order.countDocuments({
        paymentStatus: "pending",
      }),

      Ingredient.countDocuments(),

      Ingredient.countDocuments({
        $expr: {
          $lte: [
            "$stock",
            "$lowStockThreshold",
          ],
        },
      }),
    ]);

    const revenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        paidOrders,
        pendingPayments,
        totalIngredients,
        lowStockIngredients,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error(
      "Get admin dashboard stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};