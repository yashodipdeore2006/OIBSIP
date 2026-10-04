import {
  Link,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AdminLayout() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/pizza-builder", {
      replace: true,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <aside
        style={{
          width: "240px",
          padding: "20px",
          borderRight: "1px solid #ddd",
        }}
      >
        <h2>Pizza Admin</h2>

        <p>
          Welcome, {user?.name}
        </p>

        <nav>
          <div>
            <Link to="/admin">
              Dashboard
            </Link>
          </div>

          <br />

          <div>
            <Link to="/admin/inventory">
              Inventory
            </Link>
          </div>

          <br />

          <div>
            <Link to="/admin/orders">
              Orders
            </Link>
          </div>

          <br />

          <hr />

          <br />

          <button onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "30px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;