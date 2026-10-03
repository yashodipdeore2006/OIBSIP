import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async ({
  email,
  name,
  token,
}) => {
  const verificationUrl =
    `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your Pizza Delivery account",

    html: `
      <h2>Hello ${name},</h2>

      <p>
        Thank you for registering with Pizza Delivery.
      </p>

      <p>
        Click the button below to verify your email:
      </p>

      <a
        href="${verificationUrl}"
        style="
          display:inline-block;
          padding:10px 20px;
          background:#e63946;
          color:white;
          text-decoration:none;
          border-radius:5px;
        "
      >
        Verify Email
      </a>

      <p>
        This verification link will expire in 15 minutes.
      </p>
    `,
  });
};


export const sendPasswordResetEmail = async ({
  email,
  name,
  token,
}) => {
  const resetUrl =
    `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,

    subject: "Reset your Pizza Delivery password",

    html: `
      <h2>Hello ${name},</h2>

      <p>
        We received a request to reset your password.
      </p>

      <p>
        Click the button below to create a new password:
      </p>

      <a
        href="${resetUrl}"
        style="
          display:inline-block;
          padding:10px 20px;
          background:#e63946;
          color:white;
          text-decoration:none;
          border-radius:5px;
        "
      >
        Reset Password
      </a>

      <p>
        This link will expire in 15 minutes.
      </p>

      <p>
        If you didn't request this, you can safely ignore this email.
      </p>
    `,
  });
};