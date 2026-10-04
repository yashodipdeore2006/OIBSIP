import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin
  if (user.role !== "admin") {
    return <Navigate to="/pizza-builder" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;