import cron from "node-cron";

import Ingredient from "../models/Ingredient.js";
import {
  sendLowStockEmail,
} from "../services/email.service.js";

export const startLowStockJob = () => {
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log(
        "Running low-stock inventory check..."
      );

      const lowStockIngredients =
        await Ingredient.find({
          $expr: {
            $and: [
              {
                $lte: [
                  "$stock",
                  "$lowStockThreshold",
                ],
              },
              {
                $eq: [
                  "$lowStockAlertSent",
                  false,
                ],
              },
            ],
          },
        });

      if (lowStockIngredients.length === 0) {
        console.log(
          "No new low-stock ingredients."
        );

        return;
      }

      await sendLowStockEmail(
        lowStockIngredients
      );

      await Ingredient.updateMany(
        {
          _id: {
            $in: lowStockIngredients.map(
              (ingredient) => ingredient._id
            ),
          },
        },
        {
          $set: {
            lowStockAlertSent: true,
          },
        }
      );

      console.log(
        `Low-stock alert sent for ${lowStockIngredients.length} ingredient(s).`
      );
    } catch (error) {
      console.error(
        "Low-stock job error:",
        error
      );
    }
  });

  console.log(
    "Low-stock monitoring job started."
  );
};