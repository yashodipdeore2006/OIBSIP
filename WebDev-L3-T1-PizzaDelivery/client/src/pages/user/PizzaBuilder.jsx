import { useEffect, useState } from "react";
import api from "../../services/api";

function PizzaBuilder() {
  const [step, setStep] = useState(1);

  const [ingredients, setIngredients] = useState({
    base: [],
    sauce: [],
    cheese: [],
    vegetable: [],
  });

  const [pizza, setPizza] = useState({
    base: null,
    sauce: null,
    cheese: null,
    vegetables: [],
  });

  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentSuccess, setPaymentSuccess] =
    useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await api.get("/ingredients");

      const data = response.data.ingredients;

      setIngredients({
        base: data.filter((item) => item.category === "base"),
        sauce: data.filter((item) => item.category === "sauce"),
        cheese: data.filter((item) => item.category === "cheese"),
        vegetable: data.filter((item) => item.category === "vegetable"),
      });
    } catch (error) {
      console.error("Failed to load ingredients:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVegetable = (vegetable) => {
    const alreadySelected = pizza.vegetables.some(
      (item) => item._id === vegetable._id
    );

    if (alreadySelected) {
      setPizza({
        ...pizza,
        vegetables: pizza.vegetables.filter(
          (item) => item._id !== vegetable._id
        ),
      });
    } else {
      setPizza({
        ...pizza,
        vegetables: [...pizza.vegetables, vegetable],
      });
    }
  };

  const calculateTotal = () => {
    let total = 0;

    if (pizza.base) total += pizza.base.price;
    if (pizza.sauce) total += pizza.sauce.price;
    if (pizza.cheese) total += pizza.cheese.price;

    pizza.vegetables.forEach((vegetable) => {
      total += vegetable.price;
    });

    return total;
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  const createOrder = async () => {
    if (!pizza.base) {
      setError("Please select a base.");
      return;
    }

    if (!pizza.sauce) {
      setError("Please select a sauce.");
      return;
    }

    if (!pizza.cheese) {
      setError("Please select cheese.");
      return;
    }

    if (paymentProcessing) {
      return;
    }

    setError("");
    setPaymentError("");
    setPaymentSuccess(false);
    setPaymentProcessing(true);

    try {
      const orderResponse = await api.post(
        "/orders",
        {
          baseId: pizza.base._id,
          sauceId: pizza.sauce._id,
          cheeseId: pizza.cheese._id,
          vegetableIds:
            pizza.vegetables.map(
              (vegetable) => vegetable._id
            ),
        }
      );

      const createdOrder =
        orderResponse.data.order;

      if (!createdOrder?._id) {
        throw new Error(
          "Order was created but order ID was not returned."
        );
      }

      const paymentOrderResponse =
        await api.post(
          "/payments/create-order",
          {
            orderId: createdOrder._id,
          }
        );

      const payment =
        paymentOrderResponse.data.payment;

      if (!payment?.razorpayOrderId) {
        throw new Error(
          "Razorpay order could not be created."
        );
      }

      if (!payment?.keyId) {
        throw new Error(
          "Razorpay key was not returned by the server."
        );
      }

      const razorpayLoaded =
        await loadRazorpay();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay Checkout could not be loaded."
        );
      }

      const options = {
        key: payment.keyId,

        amount: payment.amount,

        currency: payment.currency,

        name: "Pizza Delivery",

        description:
          "Custom Pizza Order",

        order_id:
          payment.razorpayOrderId,

        handler: async (response) => {
          try {
            setPaymentError("");

            const verificationResponse =
              await api.post(
                "/payments/verify",
                {
                  orderId:
                    createdOrder._id,

                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }
              );

            if (
              verificationResponse.data
                ?.success
            ) {
              setPaymentSuccess(true);

              alert(
                "Payment successful and order confirmed!"
              );
            } else {
              throw new Error(
                "Payment verification was unsuccessful."
              );
            }
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            setPaymentError(
              error.response?.data?.message ||
              "Payment was received, but verification failed. Please contact support."
            );
          } finally {
            setPaymentProcessing(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);

            setPaymentError(
              "Payment was cancelled. Your order is still pending payment."
            );
          },
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#000000",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setPaymentError(
            response.error?.description ||
            "Payment failed. Please try again."
          );

          setPaymentProcessing(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Create payment/order error:",
        error
      );

      setPaymentError(
        error.response?.data?.message ||
        error.message ||
        "Unable to start payment. Please try again."
      );

      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return <p>Loading pizza builder...</p>;
  }

  return (
    <div>
      <h1>Build Your Pizza</h1>

      <p>Step {step} of 5</p>

      {step === 1 && (
        <div>
          <h2>Choose Your Base</h2>

          {ingredients.base.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  base: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.base?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button
            disabled={!pizza.base}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Choose Your Sauce</h2>

          {ingredients.sauce.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  sauce: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.sauce?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button onClick={() => setStep(1)}>
            Back
          </button>

          <button
            disabled={!pizza.sauce}
            onClick={() => setStep(3)}
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Choose Your Cheese</h2>

          {ingredients.cheese.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  cheese: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.cheese?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button onClick={() => setStep(2)}>
            Back
          </button>

          <button
            disabled={!pizza.cheese}
            onClick={() => setStep(4)}
          >
            Next
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2>Choose Vegetables</h2>

          <p>You can select multiple vegetables.</p>

          {ingredients.vegetable.map((item) => {
            const selected = pizza.vegetables.some(
              (vegetable) =>
                vegetable._id === item._id
            );

            return (
              <button
                key={item._id}
                onClick={() => toggleVegetable(item)}
              >
                {item.name} - ₹{item.price}

                {selected && (
                  <span> ✓ Selected</span>
                )}
              </button>
            );
          })}

          <br />
          <br />

          <button onClick={() => setStep(3)}>
            Back
          </button>

          <button onClick={() => setStep(5)}>
            View Summary
          </button>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2>Pizza Summary</h2>

          <p>
            <strong>Base:</strong>{" "}
            {pizza.base?.name}
          </p>

          <p>
            <strong>Sauce:</strong>{" "}
            {pizza.sauce?.name}
          </p>

          <p>
            <strong>Cheese:</strong>{" "}
            {pizza.cheese?.name}
          </p>

          <div>
            <strong>Vegetables:</strong>

            {pizza.vegetables.length === 0 ? (
              <p>No vegetables selected</p>
            ) : (
              <ul>
                {pizza.vegetables.map(
                  (vegetable) => (
                    <li key={vegetable._id}>
                      {vegetable.name}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <h2>
            Total: ₹{calculateTotal()}
          </h2>

          <button onClick={() => setStep(4)}>
            Back
          </button>

          <button
            type="button"
            onClick={createOrder}
            disabled={paymentProcessing}
          >
            {paymentProcessing
              ? "Processing Payment..."
              : "Place Order & Pay"}
          </button>

          {orderError && (
            <p style={{ color: "red" }}>
              {orderError}
            </p>
          )}

          {orderSuccess && (
            <div>
              <h2>Order Created Successfully 🎉</h2>

              <p>
                Order ID: {orderSuccess._id}
              </p>

              <p>
                Total Amount: ₹
                {orderSuccess.totalAmount}
              </p>

              <p>
                Payment Status:{" "}
                {orderSuccess.paymentStatus}
              </p>

              <p>
                Order Status:{" "}
                {orderSuccess.orderStatus}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PizzaBuilder;