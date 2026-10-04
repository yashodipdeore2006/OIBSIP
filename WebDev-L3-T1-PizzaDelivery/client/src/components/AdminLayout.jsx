import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `admin-nav-link${isActive ? " active" : ""}`;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <span className="brand-mark">🍕</span>
            <span>PizzaCraft</span>
          </div>
          <span className="admin-badge">ADMIN CONSOLE</span>
        </div>

        <div className="admin-user-card">
          <div className="admin-avatar">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name || "Administrator"}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/inventory" className={linkClass}>Inventory</NavLink>
          <NavLink to="/admin/orders" className={linkClass}>Orders</NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-secondary-button" onClick={() => navigate("/pizza-builder")}>
            Customer View
          </button>
          <button className="admin-logout-button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
