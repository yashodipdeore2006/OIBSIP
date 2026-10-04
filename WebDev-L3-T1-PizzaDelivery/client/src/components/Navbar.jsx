import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();

  const {
    user,
    loading,
    logout,
  } = useAuth();

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  if (loading) {
    return null;
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 25px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <div>
        <Link
          to="/pizza-builder"
          style={{
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Pizza Delivery
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {user ? (
          <>
            <Link to="/pizza-builder">
              Pizza Builder
            </Link>

            <Link to="/my-orders">
              My Orders
            </Link>

            {user.role === "admin" && (
              <Link to="/admin">
                Admin Dashboard
              </Link>
            )}

            <span>
              {user.name}
            </span>

            <button
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              Login
            </Link>

            <Link to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;