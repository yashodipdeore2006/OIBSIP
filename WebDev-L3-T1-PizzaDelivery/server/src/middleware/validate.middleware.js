const objectIdPattern = /^[a-fA-F0-9]{24}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateObjectIdParam = (paramName) => {
  return (req, res, next) => {
    if (!objectIdPattern.test(String(req.params[paramName] || ""))) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}.`,
      });
    }

    next();
  };
};

export const validateBody = (validator) => {
  return (req, res, next) => {
    const result = validator(req.body || {});

    if (result !== true) {
      return res.status(400).json({
        success: false,
        message: result,
      });
    }

    next();
  };
};

export const validators = {
  register: (body) => {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return "Name must contain at least 2 characters.";
    }
    if (typeof body.email !== "string" || !emailPattern.test(body.email.trim())) {
      return "A valid email address is required.";
    }
    if (typeof body.password !== "string" || body.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }
    return true;
  },

  login: (body) => {
    if (typeof body.email !== "string" || !emailPattern.test(body.email.trim())) {
      return "A valid email address is required.";
    }
    if (typeof body.password !== "string" || !body.password) {
      return "Password is required.";
    }
    return true;
  },

  forgotPassword: (body) => {
    if (typeof body.email !== "string" || !emailPattern.test(body.email.trim())) {
      return "A valid email address is required.";
    }
    return true;
  },

  resetPassword: (body) => {
    if (typeof body.password !== "string" || body.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }
    return true;
  },

  createOrder: (body) => {
    for (const key of ["baseId", "sauceId", "cheeseId"]) {
      if (typeof body[key] !== "string" || !objectIdPattern.test(body[key])) {
        return `${key} must be a valid ingredient ID.`;
      }
    }

    if (body.vegetableIds !== undefined) {
      if (!Array.isArray(body.vegetableIds) || body.vegetableIds.length > 20) {
        return "vegetableIds must be an array with at most 20 items.";
      }

      if (body.vegetableIds.some((id) => typeof id !== "string" || !objectIdPattern.test(id))) {
        return "vegetableIds must contain valid ingredient IDs.";
      }
    }

    return true;
  },

  paymentOrder: (body) => {
    if (typeof body.orderId !== "string" || !objectIdPattern.test(body.orderId)) {
      return "orderId must be a valid order ID.";
    }
    return true;
  },

  paymentVerify: (body) => {
    for (const field of [
      "orderId",
      "razorpay_order_id",
      "razorpay_payment_id",
      "razorpay_signature",
    ]) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return `${field} is required.`;
      }
    }

    if (!objectIdPattern.test(body.orderId)) {
      return "orderId must be a valid order ID.";
    }

    return true;
  },

  orderStatus: (body) => {
    return ["received", "in_kitchen", "sent_to_delivery"].includes(
      body.orderStatus
    )
      ? true
      : "Invalid order status.";
  },
};
