import { useEffect, useState } from "react";
import api from "../../services/api";

function Inventory() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState("");

  const fetchInventory = async () => {
    try {
      const response = await api.get("/admin/inventory");

      setIngredients(response.data.ingredients);
    } catch (error) {
      console.error(
        "Failed to fetch inventory:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateStock = async (id) => {
    try {
      await api.patch(`/admin/inventory/${id}`, {
        stock: Number(newStock),
      });

      setEditingId(null);
      setNewStock("");

      fetchInventory();
    } catch (error) {
      console.error(
        "Failed to update stock:",
        error
      );
    }
  };

  if (loading) {
    return <p>Loading inventory...</p>;
  }

  return (
    <div>
      <h1>Inventory</h1>

      {ingredients.map((ingredient) => (
        <div key={ingredient._id}>
          <h3>{ingredient.name}</h3>

          <p>
            Category: {ingredient.category}
          </p>

          <p>
            Price: ₹{ingredient.price}
          </p>

          <p>
            Stock: {ingredient.stock}

            {ingredient.stock <=
              ingredient.lowStockThreshold && (
                <strong> ⚠️ LOW STOCK</strong>
              )}
          </p>

          <p>
            Threshold:{" "}
            {ingredient.lowStockThreshold}
          </p>

          {editingId === ingredient._id ? (
            <div>
              <input
                type="number"
                value={newStock}
                onChange={(e) =>
                  setNewStock(e.target.value)
                }
              />

              <button
                onClick={() =>
                  updateStock(ingredient._id)
                }
              >
                Save
              </button>

              <button
                onClick={() => {
                  setEditingId(null);
                  setNewStock("");
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingId(ingredient._id);
                setNewStock(ingredient.stock);
              }}
            >
              Update Stock
            </button>
          )}

          <hr />
        </div>
      ))}
    </div>
  );
}

export default Inventory;