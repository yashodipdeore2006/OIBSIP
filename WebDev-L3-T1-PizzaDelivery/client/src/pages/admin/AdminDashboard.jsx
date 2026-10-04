import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/dashboard");
      setStats(response.data.stats);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) return <div className="screen-state">Loading dashboard…</div>;

  if (error) {
    return (
      <section className="admin-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">OPERATIONS</span>
            <h1>Dashboard</h1>
          </div>
        </div>
        <div className="alert alert-error">{error}</div>
        <button className="button button-primary" onClick={loadStats}>Try again</button>
      </section>
    );
  }

  const cards = [
    ["Total orders", stats.totalOrders, "orders"],
    ["Paid orders", stats.paidOrders, "successful payments"],
    ["Pending payments", stats.pendingPayments, "awaiting action"],
    ["Revenue", `₹${Number(stats.totalRevenue || 0).toFixed(2)}`, "captured revenue"],
    ["Ingredients", stats.totalIngredients, "catalog items"],
    ["Low stock", stats.lowStockIngredients, "needs attention"],
  ];

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h1>Dashboard</h1>
          <p>Monitor orders, payments, revenue and inventory from one place.</p>
        </div>
        <button className="button button-outline" onClick={loadStats}>Refresh</button>
      </div>

      <div className="stats-grid">
        {cards.map(([title, value, note]) => (
          <div className="stat-card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <div className="admin-action-grid">
        <Link to="/admin/orders" className="action-card">
          <span className="action-icon">↗</span>
          <strong>Manage orders</strong>
          <span>Process paid orders and update delivery stages.</span>
        </Link>
        <Link to="/admin/inventory" className="action-card">
          <span className="action-icon">▦</span>
          <strong>Manage inventory</strong>
          <span>Update stock and monitor low-stock ingredients.</span>
        </Link>
        <Link to="/pizza-builder" className="action-card">
          <span className="action-icon">🍕</span>
          <strong>Customer view</strong>
          <span>Open the public ordering experience.</span>
        </Link>
      </div>
    </section>
  );
}

export default AdminDashboard;
