import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Inventory from "./pages/admin/Inventory";
import PizzaBuilder from "./pages/user/PizzaBuilder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/inventory" element={<Inventory />} />

        {/* User */}
        <Route path="/pizza-builder" element={<PizzaBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;