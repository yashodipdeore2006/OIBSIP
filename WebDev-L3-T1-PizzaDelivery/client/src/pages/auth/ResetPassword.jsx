import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError(
        "Password reset token is missing."
      );

      return;
    }

    if (!password || !confirmPassword) {
      setError(
        "Both password fields are required."
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
        `/auth/reset-password?token=${encodeURIComponent(
          token
        )}`,
        {
          password,
        }
      );

      setMessage(
        response.data.message ||
        "Password reset successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 2000);
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Password reset failed. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Reset Password</h1>

      {!token && (
        <p>
          Invalid password reset link.
        </p>
      )}

      {token && (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password">
              New Password
            </label>

            <br />

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </div>

          <br />

          <div>
            <label htmlFor="confirmPassword">
              Confirm New Password
            </label>

            <br />

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <br />

          {error && (
            <p>
              {error}
            </p>
          )}

          {message && (
            <p>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>
        </form>
      )}

      <br />

      <Link to="/login">
        Back to Login
      </Link>
    </div>
  );
}

export default ResetPassword;