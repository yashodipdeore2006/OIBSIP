import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { startPayment } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";

const steps = ["Base", "Sauce", "Cheese", "Vegetables", "Review"];

function PizzaBuilder() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [ingredients, setIngredients] = useState({ base: [], sauce: [], cheese: [], vegetable: [] });
  const [pizza, setPizza] = useState({ base: null, sauce: null, cheese: null, vegetables: [] });
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/ingredients")
      .then((response) => {
        const data = response.data.ingredients || [];
        setIngredients({
          base: data.filter((item) => item.category === "base"),
          sauce: data.filter((item) => item.category === "sauce"),
          cheese: data.filter((item) => item.category === "cheese"),
          vegetable: data.filter((item) => item.category === "vegetable"),
        });
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load ingredients."))
      .finally(() => setLoading(false));
  }, []);

  const total = useMemo(() => [pizza.base, pizza.sauce, pizza.cheese, ...pizza.vegetables]
    .filter(Boolean)
    .reduce((sum, item) => sum + Number(item.price || 0), 0), [pizza]);

  const choose = (key, value) => setPizza((current) => ({ ...current, [key]: value }));

  const toggleVegetable = (value) => {
    setPizza((current) => ({
      ...current,
      vegetables: current.vegetables.some((item) => item._id === value._id)
        ? current.vegetables.filter((item) => item._id !== value._id)
        : [...current.vegetables, value],
    }));
  };

  const createInternalOrder = async () => {
    if (!pizza.base || !pizza.sauce || !pizza.cheese) {
      setError("Select a base, sauce and cheese before continuing.");
      return null;
    }

    const response = await api.post("/orders", {
      baseId: pizza.base._id,
      sauceId: pizza.sauce._id,
      cheeseId: pizza.cheese._id,
      vegetableIds: pizza.vegetables.map((item) => item._id),
    });

    return response.data.order;
  };

  const payOrder = async (orderId) => {
    await startPayment({
      orderId,
      name: user?.name,
      email: user?.email,
      onSuccess: async () => {
        setPendingOrderId(null);
        setMessage("Payment successful. Your pizza is confirmed.");
        setError("");
        setPizza({ base: null, sauce: null, cheese: null, vegetables: [] });
        setStep(1);
        setOrdering(false);
      },
      onError: (error, cancelled = false) => {
        setPendingOrderId(orderId);
        setError(error.message || "Payment could not be completed.");
        setMessage(cancelled ? "Your order is saved. You can retry payment from this page or My Orders." : "Your order is still pending. You can retry payment.");
        setOrdering(false);
      },
    });
  };

  const placeOrder = async () => {
    if (ordering) return;
    setOrdering(true);
    setError("");
    setMessage("");

    try {
      const order = pendingOrderId ? { _id: pendingOrderId } : await createInternalOrder();
      if (!order) {
        setOrdering(false);
        return;
      }
      setPendingOrderId(order._id);
      await payOrder(order._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to start payment.");
      setOrdering(false);
    }
  };

  if (loading) return <div className="screen-state">Preparing the pizza builder…</div>;

  const currentItems = step === 1 ? ingredients.base : step === 2 ? ingredients.sauce : step === 3 ? ingredients.cheese : ingredients.vegetable;

  return (
    <section className="customer-page builder-page">
      <div className="builder-hero">
        <div>
          <span className="eyebrow">CUSTOM PIZZA</span>
          <h1>Build your perfect pizza.</h1>
          <p>Choose your base, sauce, cheese and toppings. We calculate the price from the live ingredient catalog.</p>
        </div>
        <div className="pizza-hero">🍕</div>
      </div>

      <div className="stepper">
        {steps.map((label, index) => (
          <button key={label} className={step === index + 1 ? "step active" : step > index + 1 ? "step done" : "step"} onClick={() => index + 1 <= step && setStep(index + 1)}>
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {step < 5 ? (
        <div className="builder-layout">
          <div className="ingredient-panel">
            <div className="page-heading compact-heading">
              <div><span className="eyebrow">STEP {step}</span><h2>Choose your {steps[step - 1].toLowerCase()}</h2></div>
            </div>
            <div className="ingredient-grid">
              {currentItems.map((item) => {
                const selected = step === 4
                  ? pizza.vegetables.some((vegetable) => vegetable._id === item._id)
                  : pizza[steps[step - 1].toLowerCase()]?._id === item._id;
                const soldOut = item.stock <= 0;
                return (
                  <button
                    className={`ingredient-card${selected ? " selected" : ""}`}
                    key={item._id}
                    disabled={soldOut}
                    onClick={() => step === 4 ? toggleVegetable(item) : choose(steps[step - 1].toLowerCase(), item)}
                  >
                    <span className="ingredient-icon">{iconFor(item.category)}</span>
                    <span className="ingredient-card-name">{item.name}</span>
                    <span className="ingredient-card-price">₹{item.price}</span>
                    <span className={soldOut ? "muted" : "stock-copy"}>{soldOut ? "Out of stock" : `${item.stock} available`}</span>
                    {selected && <span className="selected-check">✓ Selected</span>}
                  </button>
                );
              })}
            </div>
            <div className="builder-actions">
              {step > 1 && <button className="button button-outline" onClick={() => setStep(step - 1)}>Back</button>}
              <button className="button button-primary" disabled={step === 1 ? !pizza.base : step === 2 ? !pizza.sauce : step === 3 ? !pizza.cheese : false} onClick={() => setStep(step + 1)}>
                {step === 4 ? "Review pizza" : "Continue"}
              </button>
            </div>
          </div>

          <SummaryCard pizza={pizza} total={total} />
        </div>
      ) : (
        <div className="review-layout">
          <div className="review-card">
            <span className="eyebrow">FINAL REVIEW</span>
            <h2>Your pizza is ready.</h2>
            <div className="review-list">
              <ReviewRow label="Base" value={pizza.base?.name} price={pizza.base?.price} />
              <ReviewRow label="Sauce" value={pizza.sauce?.name} price={pizza.sauce?.price} />
              <ReviewRow label="Cheese" value={pizza.cheese?.name} price={pizza.cheese?.price} />
              <ReviewRow label="Vegetables" value={pizza.vegetables.map((item) => item.name).join(", ") || "None"} price={pizza.vegetables.reduce((sum, item) => sum + Number(item.price || 0), 0)} />
            </div>
            <div className="review-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>
            <div className="builder-actions">
              <button className="button button-outline" disabled={ordering} onClick={() => setStep(4)}>Back</button>
              <button className="button button-primary" disabled={ordering} onClick={placeOrder}>
                {ordering ? "Opening secure checkout…" : pendingOrderId ? "Retry payment" : "Place order & pay"}
              </button>
            </div>
            <p className="muted payment-note">You will be redirected to Razorpay's secure checkout. Cancelled or failed payments keep this order available for retry.</p>
          </div>
          <SummaryCard pizza={pizza} total={total} />
        </div>
      )}
    </section>
  );
}

function SummaryCard({ pizza, total }) {
  return (
    <aside className="summary-card">
      <span className="eyebrow">YOUR PIZZA</span>
      <div className="summary-pizza">🍕</div>
      <p><strong>{pizza.base?.name || "Choose a base"}</strong></p>
      <p>{pizza.sauce?.name || "Choose a sauce"}</p>
      <p>{pizza.cheese?.name || "Choose cheese"}</p>
      <p>{pizza.vegetables.length ? pizza.vegetables.map((item) => item.name).join(", ") : "No vegetables"}</p>
      <div className="summary-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>
    </aside>
  );
}

function ReviewRow({ label, value, price }) {
  return <div className="review-row"><span>{label}</span><strong>{value || "Not selected"}</strong><span>₹{Number(price || 0).toFixed(2)}</span></div>;
}

function iconFor(category) {
  return { base: "🥯", sauce: "🍅", cheese: "🧀", vegetable: "🥬" }[category] || "🍕";
}

export default PizzaBuilder;
