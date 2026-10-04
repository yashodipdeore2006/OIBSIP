import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../../services/api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage(
          "Email verification token is missing."
        );
        return;
      }

      try {
        const response = await api.get(
          `/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );

        setStatus("success");

        setMessage(
          response.data.message ||
          "Email verified successfully."
        );
      } catch (error) {
        console.error(
          "Email verification error:",
          error
        );

        setStatus("error");

        setMessage(
          error.response?.data?.message ||
          "Email verification failed. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div>
      <h1>Email Verification</h1>

      {status === "loading" && (
        <p>Verifying your email...</p>
      )}

      {status === "success" && (
        <div>
          <h2>Email Verified Successfully ✅</h2>

          <p>{message}</p>

          <Link to="/login">
            Go to Login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <h2>Verification Failed</h2>

          <p>{message}</p>

          <Link to="/register">
            Back to Registration
          </Link>

          <br />
          <br />

          <Link to="/login">
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;