import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/forgot-password",
        {
          email,
        }
      );

      setMessage(
        response.data.message ||
        "If an account exists with this email, a password reset link has been sent."
      );
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to process your request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>

      <p>
        Enter your email address and we'll
        send you a password reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">
            Email
          </label>

          <br />

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <br />

        {message && (
          <p>
            {message}
          </p>
        )}

        {error && (
          <p>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>
      </form>

      <br />

      <Link to="/login">
        Back to Login
      </Link>
    </div>
  );
}

export default ForgotPassword;