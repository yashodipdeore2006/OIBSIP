import cron from "node-cron";

import Ingredient from "../models/Ingredient.js";
import {
  sendLowStockEmail,
} from "../services/email.service.js";

export const runLowStockCheck = async () => {
  console.log("Running low-stock inventory check...");

  const lowStockIngredients = await Ingredient.find({
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
    console.log("No new low-stock ingredients.");

    return {
      checked: true,
      alerted: 0,
    };
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

  return {
    checked: true,
    alerted: lowStockIngredients.length,
  };
};

export const startLowStockJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runLowStockCheck();
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
