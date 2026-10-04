import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

const EMPTY_FORM = {
  name: "",
  category: "base",
  price: "",
  stock: "",
  lowStockThreshold: "",
};

function Inventory() {
  const [ingredients, setIngredients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/inventory");

      setIngredients(response.data.ingredients || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return ingredients.filter((item) => {
      const name =
        typeof item?.name === "string"
          ? item.name.toLowerCase()
          : "";

      const itemCategory =
        typeof item?.category === "string"
          ? item.category
          : "";

      const matchesQuery =
        !searchText ||
        name.includes(searchText);

      const matchesCategory =
        categoryFilter === "all" ||
        itemCategory === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [ingredients, query, categoryFilter]);

  const handleAddChange = (event) => {
    const { name, value } = event.target;

    setAddForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = (form) => {
    const name = form.name.trim();

    if (!name) {
      return "Ingredient name is required.";
    }

    if (name.length < 2) {
      return "Ingredient name must contain at least 2 characters.";
    }

    if (
      !["base", "sauce", "cheese", "vegetable"].includes(
        form.category
      )
    ) {
      return "Please select a valid category.";
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    const threshold = Number(
      form.lowStockThreshold
    );

    if (!Number.isFinite(price) || price < 0) {
      return "Price must be a non-negative number.";
    }

    if (
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return "Stock must be a non-negative whole number.";
    }

    if (
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      return "Low-stock threshold must be a non-negative whole number.";
    }

    return null;
  };

  const addIngredient = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm(addForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const response = await api.post(
        "/admin/inventory",
        {
          name: addForm.name.trim(),
          category: addForm.category,
          price: Number(addForm.price),
          stock: Number(addForm.stock),
          lowStockThreshold: Number(
            addForm.lowStockThreshold
          ),
        }
      );

      setNotice(
        response.data.message ||
        "Ingredient added successfully."
      );

      setAddForm(EMPTY_FORM);
      setShowAddForm(false);

      await fetchInventory();
    } catch (error) {
      console.error(
        "Add ingredient error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to add ingredient."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (ingredient) => {
    setError("");
    setNotice("");

    setEditingId(ingredient._id);

    setEditForm({
      name: ingredient.name || "",
      category: ingredient.category || "base",
      price:
        ingredient.price !== undefined &&
          ingredient.price !== null
          ? String(ingredient.price)
          : "",
      stock:
        ingredient.stock !== undefined &&
          ingredient.stock !== null
          ? String(ingredient.stock)
          : "0",
      lowStockThreshold:
        ingredient.lowStockThreshold !==
          undefined &&
          ingredient.lowStockThreshold !== null
          ? String(
            ingredient.lowStockThreshold
          )
          : "0",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const updateIngredient = async (id) => {
    const validationError =
      validateForm(editForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const response = await api.patch(
        `/admin/inventory/${id}`,
        {
          name: editForm.name.trim(),
          category: editForm.category,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
          lowStockThreshold: Number(
            editForm.lowStockThreshold
          ),
        }
      );

      setNotice(
        response.data.message ||
        "Ingredient updated successfully."
      );

      cancelEditing();

      await fetchInventory();
    } catch (error) {
      console.error(
        "Update ingredient error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to update ingredient."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteIngredient = async (
    ingredient
  ) => {
    const confirmed = window.confirm(
      `Delete "${ingredient.name || "this ingredient"}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(ingredient._id);
      setError("");
      setNotice("");

      const response = await api.delete(
        `/admin/inventory/${ingredient._id}`
      );

      setNotice(
        response.data.message ||
        "Ingredient deleted successfully."
      );

      if (editingId === ingredient._id) {
        cancelEditing();
      }

      await fetchInventory();
    } catch (error) {
      console.error(
        "Delete ingredient error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to delete ingredient."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="screen-state">
        Loading inventory…
      </div>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            STOCK CONTROL
          </span>

          <h1>Inventory</h1>

          <p>
            Manage ingredients, prices, stock levels
            and low-stock thresholds.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            className="button button-outline"
            onClick={fetchInventory}
          >
            Refresh
          </button>

          <button
            className="button button-primary"
            onClick={() => {
              setShowAddForm(
                (current) => !current
              );

              setError("");
              setNotice("");
            }}
          >
            {showAddForm
              ? "Close"
              : "+ Add Ingredient"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="alert alert-success">
          {notice}
        </div>
      )}

      {showAddForm && (
        <form
          className="form-card"
          onSubmit={addIngredient}
          style={{
            marginBottom: "24px",
          }}
        >
          <div className="form-card-header">
            <div>
              <span className="eyebrow">
                NEW ITEM
              </span>

              <h2>Add Ingredient</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="add-name">
                Name
              </label>

              <input
                id="add-name"
                className="field"
                name="name"
                type="text"
                value={addForm.name}
                onChange={handleAddChange}
                placeholder="e.g. Mozzarella"
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-category">
                Category
              </label>

              <select
                id="add-category"
                className="field"
                name="category"
                value={addForm.category}
                onChange={handleAddChange}
              >
                <option value="base">
                  Base
                </option>

                <option value="sauce">
                  Sauce
                </option>

                <option value="cheese">
                  Cheese
                </option>

                <option value="vegetable">
                  Vegetable
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="add-price">
                Price
              </label>

              <input
                id="add-price"
                className="field"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={addForm.price}
                onChange={handleAddChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-stock">
                Stock
              </label>

              <input
                id="add-stock"
                className="field"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={addForm.stock}
                onChange={handleAddChange}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="add-threshold">
                Low Stock Threshold
              </label>

              <input
                id="add-threshold"
                className="field"
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                value={addForm.lowStockThreshold}
                onChange={handleAddChange}
                placeholder="10"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Adding..."
                : "Add Ingredient"}
            </button>

            <button
              className="button button-outline"
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input
          className="field"
          placeholder="Search ingredients…"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <select
          className="field"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All categories
          </option>

          <option value="base">
            Base
          </option>

          <option value="sauce">
            Sauce
          </option>

          <option value="cheese">
            Cheese
          </option>

          <option value="vegetable">
            Vegetable
          </option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-head">
          <span>Ingredient</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Threshold</span>
          <span>Action</span>
        </div>

        {filtered.map((ingredient) => {
          const stock = Number(
            ingredient.stock || 0
          );

          const threshold = Number(
            ingredient.lowStockThreshold || 0
          );

          const low = stock <= threshold;

          const isEditing =
            editingId === ingredient._id;

          if (isEditing) {
            return (
              <div
                className="table-row"
                key={ingredient._id}
              >
                <div className="table-edit-fields">
                  <input
                    className="field field-small"
                    name="name"
                    value={editForm.name}
                    onChange={
                      handleEditChange
                    }
                    placeholder="Name"
                  />

                  <select
                    className="field field-small"
                    name="category"
                    value={
                      editForm.category
                    }
                    onChange={
                      handleEditChange
                    }
                  >
                    <option value="base">
                      Base
                    </option>

                    <option value="sauce">
                      Sauce
                    </option>

                    <option value="cheese">
                      Cheese
                    </option>

                    <option value="vegetable">
                      Vegetable
                    </option>
                  </select>

                  <input
                    className="field field-small"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={
                      handleEditChange
                    }
                    placeholder="Price"
                  />

                  <input
                    className="field field-small"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.stock}
                    onChange={
                      handleEditChange
                    }
                    placeholder="Stock"
                  />

                  <input
                    className="field field-small"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      editForm.lowStockThreshold
                    }
                    onChange={
                      handleEditChange
                    }
                    placeholder="Threshold"
                  />

                  <div className="inline-edit">
                    <button
                      className="button button-primary button-small"
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        updateIngredient(
                          ingredient._id
                        )
                      }
                    >
                      {saving
                        ? "Saving..."
                        : "Save"}
                    </button>

                    <button
                      className="button button-outline button-small"
                      type="button"
                      disabled={saving}
                      onClick={
                        cancelEditing
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              className="table-row"
              key={ingredient._id}
            >
              <strong>
                {ingredient.name ||
                  "Unnamed ingredient"}
              </strong>

              <span className="category-tag">
                {ingredient.category ||
                  "Unknown"}
              </span>

              <span>
                ₹
                {Number(
                  ingredient.price || 0
                ).toFixed(2)}
              </span>

              <span>
                {stock}

                {low && (
                  <span className="status-pill status-danger">
                    LOW
                  </span>
                )}
              </span>

              <span>{threshold}</span>

              <span
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="button button-outline button-small"
                  type="button"
                  onClick={() =>
                    startEditing(
                      ingredient
                    )
                  }
                >
                  Edit
                </button>

                <button
                  className="button button-danger button-small"
                  type="button"
                  disabled={
                    deletingId ===
                    ingredient._id
                  }
                  onClick={() =>
                    deleteIngredient(
                      ingredient
                    )
                  }
                >
                  {deletingId === ingredient._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            No ingredients match your filters.
          </div>
        )}
      </div>
    </section>
  );
}

export default Inventory;