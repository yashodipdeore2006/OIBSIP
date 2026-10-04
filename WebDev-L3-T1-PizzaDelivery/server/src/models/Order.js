import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pizza: {
      base: {
        ingredientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },

      sauce: {
        ingredientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },

      cheese: {
        ingredientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },

      vegetables: [
        {
          ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ingredient",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ["received", "in_kitchen", "sent_to_delivery"],
      default: "received",
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;