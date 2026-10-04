import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  if (loading || location.pathname.startsWith("/admin")) return null;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="site-header">
      <Link to={user ? "/pizza-builder" : "/login"} className="brand-link">
        <span className="brand-mark">🍕</span>
        <span>PizzaCraft</span>
      </Link>

      <nav className="site-nav">
        {user ? (
          <>
            <Link to="/pizza-builder">Build Pizza</Link>
            <Link to="/my-orders">My Orders</Link>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <span className="user-chip">{user.name}</span>
            <button className="button button-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link className="button button-primary" to="/register">Create account</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
