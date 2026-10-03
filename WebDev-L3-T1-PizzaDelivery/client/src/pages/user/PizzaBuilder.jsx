import { useEffect, useState } from "react";
import api from "../../services/api";

function PizzaBuilder() {
  // -----------------------------
  // STEP / INGREDIENT STATE
  // -----------------------------

  const [step, setStep] = useState(1);

  const [ingredients, setIngredients] = useState({
    base: [],
    sauce: [],
    cheese: [],
    vegetable: [],
  });

  const [pizza, setPizza] = useState({
    base: null,
    sauce: null,
    cheese: null,
    vegetables: [],
  });

  const [loading, setLoading] = useState(true);

  // -----------------------------
  // FETCH INGREDIENTS
  // -----------------------------

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await api.get("/ingredients");

      const data = response.data.ingredients;

      setIngredients({
        base: data.filter(
          (item) => item.category === "base"
        ),

        sauce: data.filter(
          (item) => item.category === "sauce"
        ),

        cheese: data.filter(
          (item) => item.category === "cheese"
        ),

        vegetable: data.filter(
          (item) => item.category === "vegetable"
        ),
      });
    } catch (error) {
      console.error(
        "Failed to load ingredients:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // VEGETABLE SELECTION
  // -----------------------------

  const toggleVegetable = (vegetable) => {
    const alreadySelected = pizza.vegetables.some(
      (item) => item._id === vegetable._id
    );

    if (alreadySelected) {
      setPizza({
        ...pizza,

        vegetables: pizza.vegetables.filter(
          (item) => item._id !== vegetable._id
        ),
      });
    } else {
      setPizza({
        ...pizza,

        vegetables: [
          ...pizza.vegetables,
          vegetable,
        ],
      });
    }
  };

  // -----------------------------
  // CALCULATE TOTAL
  // -----------------------------

  const calculateTotal = () => {
    let total = 0;

    if (pizza.base) {
      total += pizza.base.price;
    }

    if (pizza.sauce) {
      total += pizza.sauce.price;
    }

    if (pizza.cheese) {
      total += pizza.cheese.price;
    }

    pizza.vegetables.forEach((vegetable) => {
      total += vegetable.price;
    });

    return total;
  };

  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading) {
    return <p>Loading pizza builder...</p>;
  }

  // -----------------------------
  // PAGE
  // -----------------------------

  return (
    <div>
      <h1>Build Your Pizza</h1>

      <p>Step {step} of 5</p>

      {/* ================================= */}
      {/* STEP 1 - BASE */}
      {/* ================================= */}

      {step === 1 && (
        <div>
          <h2>Choose Your Base</h2>

          {ingredients.base.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  base: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.base?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button
            disabled={!pizza.base}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================================= */}
      {/* STEP 2 - SAUCE */}
      {/* ================================= */}

      {step === 2 && (
        <div>
          <h2>Choose Your Sauce</h2>

          {ingredients.sauce.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  sauce: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.sauce?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button onClick={() => setStep(1)}>
            Back
          </button>

          <button
            disabled={!pizza.sauce}
            onClick={() => setStep(3)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================================= */}
      {/* STEP 3 - CHEESE */}
      {/* ================================= */}

      {step === 3 && (
        <div>
          <h2>Choose Your Cheese</h2>

          {ingredients.cheese.map((item) => (
            <button
              key={item._id}
              onClick={() =>
                setPizza({
                  ...pizza,
                  cheese: item,
                })
              }
            >
              {item.name} - ₹{item.price}

              {pizza.cheese?._id === item._id && (
                <span> ✓ Selected</span>
              )}
            </button>
          ))}

          <br />
          <br />

          <button onClick={() => setStep(2)}>
            Back
          </button>

          <button
            disabled={!pizza.cheese}
            onClick={() => setStep(4)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================================= */}
      {/* STEP 4 - VEGETABLES */}
      {/* ================================= */}

      {step === 4 && (
        <div>
          <h2>Choose Vegetables</h2>

          <p>
            You can select multiple vegetables.
          </p>

          {ingredients.vegetable.map((item) => {
            const selected =
              pizza.vegetables.some(
                (vegetable) =>
                  vegetable._id === item._id
              );

            return (
              <button
                key={item._id}
                onClick={() =>
                  toggleVegetable(item)
                }
              >
                {item.name} - ₹{item.price}

                {selected && (
                  <span> ✓ Selected</span>
                )}
              </button>
            );
          })}

          <br />
          <br />

          <button onClick={() => setStep(3)}>
            Back
          </button>

          <button onClick={() => setStep(5)}>
            View Summary
          </button>
        </div>
      )}

      {/* ================================= */}
      {/* STEP 5 - SUMMARY */}
      {/* ================================= */}

      {step === 5 && (
        <div>
          <h2>Pizza Summary</h2>

          <p>
            <strong>Base:</strong>{" "}
            {pizza.base?.name}
          </p>

          <p>
            <strong>Sauce:</strong>{" "}
            {pizza.sauce?.name}
          </p>

          <p>
            <strong>Cheese:</strong>{" "}
            {pizza.cheese?.name}
          </p>

          <div>
            <strong>Vegetables:</strong>

            {pizza.vegetables.length === 0 ? (
              <p>No vegetables selected</p>
            ) : (
              <ul>
                {pizza.vegetables.map(
                  (vegetable) => (
                    <li key={vegetable._id}>
                      {vegetable.name}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          <h2>
            Total: ₹{calculateTotal()}
          </h2>

          <button onClick={() => setStep(4)}>
            Back
          </button>

          <button>
            Continue to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default PizzaBuilder;