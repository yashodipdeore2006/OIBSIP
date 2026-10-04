import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      name,
      email,
      password,
      confirmPassword,
    } = formData;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "All fields are required."
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
        }
      );

      setSuccess(
        response.data.message ||
        "Registration successful. Please check your email to verify your account."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">
            Name
          </label>

          <br />

          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            autoComplete="name"
          />
        </div>

        <br />

        <div>
          <label htmlFor="email">
            Email
          </label>

          <br />

          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <br />

        <div>
          <label htmlFor="password">
            Password
          </label>

          <br />

          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="new-password"
          />
        </div>

        <br />

        <div>
          <label htmlFor="confirmPassword">
            Confirm Password
          </label>

          <br />

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            autoComplete="new-password"
          />
        </div>

        <br />

        {error && (
          <p>
            {error}
          </p>
        )}

        {success && (
          <p>
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating account..."
            : "Register"}
        </button>
      </form>

      <br />

      <p>
        Already have an account?{" "}
        <Link to="/login">
          Login
        </Link>
      </p>
    </div>
  );
}

export default Register;