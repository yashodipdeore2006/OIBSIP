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


export const sendLowStockEmail = async (
  ingredients
) => {
  try {
    const adminEmail = process.env.SMTP_USER;

    const ingredientRows = ingredients
      .map(
        (ingredient) => `
          <tr>
            <td>${ingredient.name}</td>
            <td>${ingredient.category}</td>
            <td>${ingredient.stock}</td>
            <td>${ingredient.lowStockThreshold}</td>
          </tr>
        `
      )
      .join("");

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: "Pizza Delivery - Low Stock Alert",

      html: `
        <h2>Low Stock Alert</h2>

        <p>
          The following ingredients are running low:
        </p>

        <table
          border="1"
          cellpadding="8"
          cellspacing="0"
        >
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Threshold</th>
            </tr>
          </thead>

          <tbody>
            ${ingredientRows}
          </tbody>
        </table>

        <p>
          Please update the inventory.
        </p>
      `,
    });

    console.log(
      "Low-stock email sent successfully."
    );
  } catch (error) {
    console.error(
      "Low-stock email error:",
      error
    );

    throw error;
  }
};