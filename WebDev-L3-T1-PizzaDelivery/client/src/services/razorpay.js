import api from "./api";

let scriptPromise = null;

export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return scriptPromise;
};

export const startPayment = async ({
  orderId,
  name,
  email,
  onSuccess,
  onError,
}) => {
  const response = await api.post("/payments/create-order", { orderId });
  const payment = response.data.payment;

  if (!payment?.razorpayOrderId || !payment?.keyId) {
    throw new Error("Payment gateway order could not be created.");
  }

  const loaded = await loadRazorpay();
  if (!loaded) {
    throw new Error("Payment checkout could not be loaded.");
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const handleSuccess = async (gatewayResponse) => {
      try {
        const verification = await api.post("/payments/verify", {
          orderId,
          razorpay_order_id: gatewayResponse.razorpay_order_id,
          razorpay_payment_id: gatewayResponse.razorpay_payment_id,
          razorpay_signature: gatewayResponse.razorpay_signature,
        });

        await onSuccess(verification.data.order);
        finish(verification.data.order);
      } catch (error) {
        await onError(error);
        finish(null);
      }
    };

    const handleError = async (error, cancelled = false) => {
      const normalized = error instanceof Error
        ? error
        : new Error("Payment failed. Please try again.");

      await onError(normalized, cancelled);
      finish(null);
    };

    const razorpay = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: "PizzaCraft",
      description: "Custom Pizza Order",
      order_id: payment.razorpayOrderId,
      prefill: {
        name: name || "",
        email: email || "",
      },
      theme: { color: "#e63946" },
      handler: handleSuccess,
      modal: {
        ondismiss: () => {
          void handleError(
            new Error("Payment was cancelled. Your order is still pending payment."),
            true
          );
        },
      },
    });

    razorpay.on("payment.failed", (response) => {
      void handleError(
        new Error(
          response.error?.description || "Payment failed. Please try again."
        )
      );
    });

    try {
      razorpay.open();
    } catch (error) {
      void handleError(error);
    }
  });
};
