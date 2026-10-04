import { useEffect, useState } from "react";
import api from "../../services/api";
import { getSocket } from "../../services/socket";
import { startPayment } from "../../services/razorpay";
import { useAuth } from "../../context/AuthContext";

const steps = ["received", "in_kitchen", "sent_to_delivery"];
const labels = {
  received: "Order received",
  in_kitchen: "In kitchen",
  sent_to_delivery: "Sent to delivery",
};

function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/orders/my-orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const handler = (data) => {
      if (!data?.order?._id) return;
      setOrders((current) => current.map((order) => order._id === data.order._id ? data.order : order));
    };
    socket.on("order-status-updated", handler);
    return () => socket.off("order-status-updated", handler);
  }, []);

  const retryPayment = async (orderId) => {
    setPayingId(orderId);
    setError("");
    try {
      await startPayment({
        orderId,
        name: user?.name,
        email: user?.email,
        onSuccess: (order) => setOrders((current) => current.map((item) => item._id === order._id ? order : item)),
        onError: (err) => setError(err.message || "Payment failed."),
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Payment could not be started.");
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <div className="screen-state">Loading your orders…</div>;

  return (
    <section className="customer-page">
      <div className="page-heading customer-heading">
        <div><span className="eyebrow">ACCOUNT</span><h1>My Orders</h1><p>Track every pizza and retry pending payments from the same order.</p></div>
        <button className="button button-outline" onClick={fetchOrders}>Refresh</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state large-empty"><div className="empty-emoji">🍕</div><h2>No orders yet</h2><p>Build your first custom pizza and it will appear here.</p></div>
      ) : (
        <div className="orders-list customer-orders">
          {orders.map((order) => <OrderCard key={order._id} order={order} paying={payingId === order._id} onRetry={() => retryPayment(order._id)} />)}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order, paying, onRetry }) {
  const current = steps.indexOf(order.orderStatus);
  const needsPayment = order.paymentStatus !== "paid";

  return (
    <article className="customer-order-card">
      <div className="customer-order-header">
        <div><span className="eyebrow">ORDER #{order._id.slice(-8).toUpperCase()}</span><h2>Custom pizza</h2><p>{new Date(order.createdAt).toLocaleString()}</p></div>
        <div className="order-pills">
          <span className={`status-pill status-${order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refund_required" ? "danger" : "warning"}`}>{formatPayment(order.paymentStatus)}</span>
        </div>
      </div>

      <div className="customer-order-body">
        <div>
          <p><strong>Base:</strong> {order.pizza?.base?.name}</p>
          <p><strong>Sauce:</strong> {order.pizza?.sauce?.name}</p>
          <p><strong>Cheese:</strong> {order.pizza?.cheese?.name}</p>
          <p><strong>Toppings:</strong> {order.pizza?.vegetables?.map((item) => item.name).join(", ") || "None"}</p>
        </div>
        <div className="customer-order-price"><span>Total</span><strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong></div>
      </div>

      {order.paymentFailureReason && <div className="alert alert-error compact">{order.paymentFailureReason}</div>}

      <div className="tracking-block">
        <div className="tracking-line" />
        {steps.map((status, index) => <div className={index <= current ? "tracking-step active" : "tracking-step"} key={status}><span>{index <= current ? "✓" : index + 1}</span><small>{labels[status]}</small></div>)}
      </div>

      <div className="customer-order-footer">
        {needsPayment && order.paymentStatus !== "refund_required" && <button className="button button-primary" disabled={paying} onClick={onRetry}>{paying ? "Opening checkout…" : "Complete payment"}</button>}
        {order.paymentStatus === "refund_required" && <span className="muted">Payment captured; support must complete the refund.</span>}
        {order.paymentStatus === "paid" && <span className="success-copy">Payment confirmed ✓</span>}
      </div>
    </article>
  );
}

function formatPayment(status) {
  return { pending: "Payment pending", paid: "Paid", failed: "Payment failed", refund_required: "Refund required" }[status] || status;
}

export default MyOrders;
