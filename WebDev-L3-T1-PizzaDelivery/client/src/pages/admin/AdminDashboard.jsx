import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get(
          "/admin/dashboard"
        );

        setStats(response.data.stats);
      } catch (error) {
        console.error(
          "Dashboard stats error:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div>
        <h1>Admin Dashboard</h1>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Admin Dashboard</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <p>
        Manage your Pizza Delivery platform.
      </p>

      <hr />

      <h2>Business Overview</h2>

      <div>
        <div>
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>

        <div>
          <h3>Paid Orders</h3>
          <p>{stats.paidOrders}</p>
        </div>

        <div>
          <h3>Pending Payments</h3>
          <p>{stats.pendingPayments}</p>
        </div>

        <div>
          <h3>Total Revenue</h3>
          <p>
            ₹{stats.totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      <hr />

      <h2>Inventory Overview</h2>

      <div>
        <div>
          <h3>Total Ingredients</h3>
          <p>{stats.totalIngredients}</p>
        </div>

        <div>
          <h3>Low Stock Items</h3>
          <p>{stats.lowStockIngredients}</p>
        </div>
      </div>

      <hr />

      <h2>Admin Actions</h2>

      <div>
        <Link to="/admin/inventory">
          Manage Inventory
        </Link>
      </div>

      <br />

      <div>
        <Link to="/admin/orders">
          Manage Orders
        </Link>
      </div>

      <br />

      <div>
        <Link to="/pizza-builder">
          View Pizza Builder
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;