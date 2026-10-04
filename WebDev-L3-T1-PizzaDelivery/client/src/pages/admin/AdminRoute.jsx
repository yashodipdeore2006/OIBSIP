import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        const user = response.data.user;

        setIsAdmin(user?.role === "admin");
      } catch (error) {
        console.error(
          "Admin authentication error:",
          error
        );

        localStorage.removeItem("token");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (loading) {
    return <p>Checking admin access...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/pizza-builder" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;