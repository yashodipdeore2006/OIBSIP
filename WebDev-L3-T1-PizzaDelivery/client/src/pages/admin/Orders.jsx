import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const statuses = [
  ["received", "Order Received"],
  ["in_kitchen", "In Kitchen"],
  ["sent_to_delivery", "Sent to Delivery"],
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/orders/admin");
      setOrders(response.data.orders || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(
    () => orders.filter((order) =>
      (paymentFilter === "all" || order.paymentStatus === paymentFilter) &&
      (statusFilter === "all" || order.orderStatus === statusFilter)
    ),
    [orders, paymentFilter, statusFilter]
  );

  const advanceStatus = async (order) => {
    const index = statuses.findIndex(([value]) => value === order.orderStatus);
    const next = statuses[index + 1]?.[0];
    if (!next || order.paymentStatus !== "paid") return;

    try {
      const response = await api.patch(`/orders/admin/${order._id}/status`, {
        orderStatus: next,
      });
      setOrders((current) =>
        current.map((item) => item._id === order._id ? response.data.order : item)
      );
    } catch (error) {
      setError(error.response?.data?.message || "Could not update order status.");
    }
  };

  if (loading) return <div className="screen-state">Loading orders…</div>;

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FULFILMENT</span>
          <h1>Orders</h1>
          <p>Review payments and move paid orders through the fulfilment pipeline.</p>
        </div>
        <button className="button button-outline" onClick={fetchOrders}>Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <select className="field" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="all">All payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refund_required">Refund required</option>
        </select>
        <select className="field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All order statuses</option>
          <option value="received">Order received</option>
          <option value="in_kitchen">In kitchen</option>
          <option value="sent_to_delivery">Sent to delivery</option>
        </select>
        <button className="button button-outline" onClick={() => { setPaymentFilter("all"); setStatusFilter("all"); }}>
          Clear filters
        </button>
      </div>

      <div className="orders-list">
        {filteredOrders.map((order) => {
          const nextIndex = statuses.findIndex(([value]) => value === order.orderStatus) + 1;
          const nextStatus = statuses[nextIndex];
          const isPaid = order.paymentStatus === "paid";

          return (
            <article className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <span className="eyebrow">ORDER #{order._id.slice(-8).toUpperCase()}</span>
                  <h2>{order.user?.name || "Unknown customer"}</h2>
                  <p>{order.user?.email || "No email"}</p>
                </div>
                <div className="order-pills">
                  <span className={`status-pill status-${order.paymentStatus === "paid" ? "success" : order.paymentStatus === "refund_required" ? "danger" : "warning"}`}>
                    {formatPaymentStatus(order.paymentStatus)}
                  </span>
                  <span className="status-pill status-neutral">{formatOrderStatus(order.orderStatus)}</span>
                </div>
              </div>

              <div className="order-grid">
                <div>
                  <h3>Pizza</h3>
                  <p><strong>Base:</strong> {order.pizza?.base?.name}</p>
                  <p><strong>Sauce:</strong> {order.pizza?.sauce?.name}</p>
                  <p><strong>Cheese:</strong> {order.pizza?.cheese?.name}</p>
                  <p><strong>Vegetables:</strong> {order.pizza?.vegetables?.map((item) => item.name).join(", ") || "None"}</p>
                </div>
                <div>
                  <h3>Payment</h3>
                  <p className="order-total">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                  {order.razorpayPaymentId && <p className="muted">Payment ID: {order.razorpayPaymentId}</p>}
                  {order.paymentFailureReason && <div className="alert alert-error compact">{order.paymentFailureReason}</div>}
                </div>
              </div>

              <div className="order-footer">
                <div className="progress-steps">
                  {statuses.map(([value, label], index) => {
                    const current = statuses.findIndex(([status]) => status === order.orderStatus);
                    return <span className={index <= current ? "done" : ""} key={value}>{index + 1}. {label}</span>;
                  })}
                </div>
                {nextStatus && isPaid ? (
                  <button className="button button-primary" onClick={() => advanceStatus(order)}>
                    Move to {nextStatus[1]}
                  </button>
                ) : !isPaid ? (
                  <span className="muted">Complete payment before fulfilment.</span>
                ) : (
                  <span className="muted">Fulfilment complete.</span>
                )}
              </div>
            </article>
          );
        })}

        {filteredOrders.length === 0 && <div className="empty-state">No orders match the selected filters.</div>}
      </div>
    </section>
  );
}

function formatPaymentStatus(status) {
  return {
    pending: "Pending payment",
    paid: "Paid",
    failed: "Payment failed",
    refund_required: "Refund required",
  }[status] || "Unknown payment";
}

function formatOrderStatus(status) {
  return {
    received: "Order received",
    in_kitchen: "In kitchen",
    sent_to_delivery: "Sent to delivery",
  }[status] || "Unknown status";
}

export default Orders;
