import { useEffect, useState } from "react";

import api from "../../services/api";

import {
  getSocket,
} from "../../services/socket";

function MyOrders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/orders/my-orders"
      );

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error(
        "Fetch orders error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /*
    Real-time order status updates
  */

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    const handleOrderStatusUpdate = (
      data
    ) => {
      if (!data?.order?._id) {
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === data.order._id
            ? data.order
            : order
        )
      );
    };

    socket.on(
      "order-status-updated",
      handleOrderStatusUpdate
    );

    return () => {
      socket.off(
        "order-status-updated",
        handleOrderStatusUpdate
      );
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h1>My Orders</h1>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>My Orders</h1>
        <p>{error}</p>

        <button onClick={fetchOrders}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div>
          <p>
            You haven't placed any orders yet.
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }) {
  const statusSteps = [
    {
      value: "received",
      label: "Order Received",
    },
    {
      value: "in_kitchen",
      label: "In Kitchen",
    },
    {
      value: "sent_to_delivery",
      label: "Sent to Delivery",
    },
  ];

  const currentStatusIndex =
    statusSteps.findIndex(
      (step) =>
        step.value === order.orderStatus
    );

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h2>
        Order #{order._id.slice(-6)}
      </h2>

      <p>
        Total: ₹
        {order.totalAmount.toFixed(2)}
      </p>

      <p>
        Payment:{" "}
        <strong>
          {order.paymentStatus}
        </strong>
      </p>

      <hr />

      <h3>Pizza</h3>

      <p>
        <strong>Base:</strong>{" "}
        {order.pizza.base.name}
      </p>

      <p>
        <strong>Sauce:</strong>{" "}
        {order.pizza.sauce.name}
      </p>

      <p>
        <strong>Cheese:</strong>{" "}
        {order.pizza.cheese.name}
      </p>

      {order.pizza.vegetables?.length >
        0 && (
          <div>
            <strong>
              Vegetables:
            </strong>

            <ul>
              {order.pizza.vegetables.map(
                (vegetable) => (
                  <li
                    key={
                      vegetable.ingredientId
                    }
                  >
                    {vegetable.name}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      <hr />

      <h3>Order Status</h3>

      <div>
        {statusSteps.map(
          (step, index) => {
            const isCompleted =
              currentStatusIndex >= index;

            return (
              <div
                key={step.value}
                style={{
                  marginBottom: "12px",
                }}
              >
                <span>
                  {isCompleted
                    ? "✓"
                    : "○"}
                </span>{" "}
                <strong>
                  {step.label}
                </strong>
              </div>
            );
          }
        )}
      </div>

      <p>
        Current status:{" "}
        <strong>
          {formatOrderStatus(
            order.orderStatus
          )}
        </strong>
      </p>
    </div>
  );
}

function formatOrderStatus(status) {
  const labels = {
    received: "Order Received",
    in_kitchen: "In Kitchen",
    sent_to_delivery:
      "Sent to Delivery",
  };

  return (
    labels[status] ||
    "Unknown Status"
  );
}

export default MyOrders;