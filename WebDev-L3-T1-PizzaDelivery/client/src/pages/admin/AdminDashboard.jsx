import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>

      <p>Welcome to the Pizza Delivery admin panel.</p>

      <Link to="/admin/inventory">
        Manage Inventory
      </Link>
    </div>
  );
}

export default AdminDashboard;