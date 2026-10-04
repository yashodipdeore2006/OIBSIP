import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import PizzaBuilder from "./pages/user/PizzaBuilder";
import MyOrders from "./pages/user/MyOrders";

function AppShell() {
  const location = useLocation();

  const isAdmin =
    location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navbar />}

      <main
        className={
          isAdmin
            ? "app-main admin-main"
            : "app-main"
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to="/pizza-builder"
                replace
              />
            }
          />

          {/* Authentication */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/verify-email"
            element={<VerifyEmail />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* User */}

          <Route element={<ProtectedRoute />}>
            <Route
              path="/pizza-builder"
              element={<PizzaBuilder />}
            />

            <Route
              path="/my-orders"
              element={<MyOrders />}
            />
          </Route>

          {/* Admin */}

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route
                path="/admin"
                element={<AdminDashboard />}
              />

              <Route
                path="/admin/inventory"
                element={<Inventory />}
              />

              <Route
                path="/admin/orders"
                element={<Orders />}
              />
            </Route>
          </Route>

          {/* Fallback */}

          <Route
            path="*"
            element={
              <Navigate
                to="/pizza-builder"
                replace
              />
            }
          />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;