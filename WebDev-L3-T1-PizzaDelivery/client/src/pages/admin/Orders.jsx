import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

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
      console.error("Fetch admin orders error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesPayment =
        paymentFilter === "all" ||
        order.paymentStatus === paymentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        order.orderStatus === statusFilter;

      return matchesPayment && matchesStatus;
    });
  }, [orders, paymentFilter, statusFilter]);

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      const response = await api.patch(
        `/orders/admin/${orderId}/status`,
        {
          orderStatus: newStatus,
        }
      );

      const updatedOrder = response.data.order;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === updatedOrder._id
            ? updatedOrder
            : order
        )
      );
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Failed to update order status."
      );
    }
  };

  if (loading) {
    return (
      <div>
        <h1>Orders</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Orders</h1>

        <p>{error}</p>

        <button onClick={fetchOrders}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Orders</h1>

      {/* Filters */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label>
            <strong>Payment:</strong>{" "}
          </label>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(event.target.value)
            }
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label>
            <strong>Order Status:</strong>{" "}
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All Statuses</option>
            <option value="received">
              Order Received
            </option>
            <option value="in_kitchen">
              In Kitchen
            </option>
            <option value="sent_to_delivery">
              Sent to Delivery
            </option>
          </select>
        </div>

        <button
          onClick={() => {
            setPaymentFilter("all");
            setStatusFilter("all");
          }}
        >
          Clear Filters
        </button>
      </div>

      <p>
        Showing{" "}
        <strong>{filteredOrders.length}</strong>{" "}
        of <strong>{orders.length}</strong> orders
      </p>

      {/* Orders */}

      {filteredOrders.length === 0 ? (
        <div>
          <p>No orders match the selected filters.</p>
        </div>
      ) : (
        <div>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusChange={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onStatusChange,
}) {
  const isPaid =
    order.paymentStatus === "paid";

  const canChangeStatus =
    isPaid &&
    order.orderStatus !== "sent_to_delivery";

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "8px",
      }}
    >
      <h2>
        Order #{order._id.slice(-6)}
      </h2>

      {/* Customer */}

      <h3>Customer</h3>

      <p>
        <strong>Name:</strong>{" "}
        {order.user?.name || "Unknown"}
      </p>

      <p>
        <strong>Email:</strong>{" "}
        {order.user?.email || "Unknown"}
      </p>

      <hr />

      {/* Pizza */}

      <h3>Pizza</h3>

      <p>
        <strong>Base:</strong>{" "}
        {order.pizza?.base?.name}
      </p>

      <p>
        <strong>Sauce:</strong>{" "}
        {order.pizza?.sauce?.name}
      </p>

      <p>
        <strong>Cheese:</strong>{" "}
        {order.pizza?.cheese?.name}
      </p>

      {order.pizza?.vegetables?.length > 0 && (
        <div>
          <strong>Vegetables:</strong>

          <ul>
            {order.pizza.vegetables.map(
              (vegetable) => (
                <li key={vegetable.ingredientId}>
                  {vegetable.name}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      <hr />

      {/* Payment */}

      <h3>Payment</h3>

      <p>
        <strong>Amount:</strong>{" "}
        ₹{Number(order.totalAmount || 0).toFixed(2)}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        <span>
          {formatPaymentStatus(
            order.paymentStatus
          )}
        </span>
      </p>

      {order.razorpayPaymentId && (
        <p>
          <strong>Payment ID:</strong>{" "}
          {order.razorpayPaymentId}
        </p>
      )}

      <hr />

      {/* Order Status */}

      <h3>Order Status</h3>

      <p>
        <strong>Current:</strong>{" "}
        {formatOrderStatus(order.orderStatus)}
      </p>

      <select
        value={order.orderStatus}
        disabled={!canChangeStatus}
        onChange={(event) =>
          onStatusChange(
            order._id,
            event.target.value
          )
        }
      >
        <option value="received">
          Order Received
        </option>

        <option value="in_kitchen">
          In Kitchen
        </option>

        <option value="sent_to_delivery">
          Sent to Delivery
        </option>
      </select>

      {!isPaid && (
        <p>
          <strong>
            Payment is not completed.
          </strong>{" "}
          This order cannot move to the kitchen.
        </p>
      )}

      {order.orderStatus ===
        "sent_to_delivery" && (
          <p>
            This order has completed all available
            status steps.
          </p>
        )}
    </div>
  );
}

function formatPaymentStatus(status) {
  const labels = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
  };

  return labels[status] || "Unknown";
}

function formatOrderStatus(status) {
  const labels = {
    received: "Order Received",
    in_kitchen: "In Kitchen",
    sent_to_delivery: "Sent to Delivery",
  };

  return labels[status] || "Unknown";
}

export default Orders;