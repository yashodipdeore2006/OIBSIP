# Apply the PizzaCraft production overlay

This ZIP is an overlay, not a replacement copy of the entire repository. Copy its files into your existing `OIBSIP` checkout, preserving the paths shown in the ZIP.

## Windows PowerShell

From the repository root:

```powershell
Expand-Archive -Path .\PizzaCraft-production-hardening-overlay.zip -DestinationPath .\_pizza-overlay -Force
robocopy .\_pizza-overlay\pizza-production-overlay . /E
Remove-Item .\_pizza-overlay -Recurse -Force
```

The ZIP also contains the final project README and `render.yaml`.

## Then

Backend:

```powershell
cd .\WebDev-L3-T1-PizzaDelivery\server
npm install
npm run dev
```

Frontend:

```powershell
cd ..\client
npm install
npm run dev
```

Create `server/.env` from `server/.env.example` and `client/.env` from `client/.env.example`.

## Production

Set the production values in Render for:

```text
CLIENT_URL
MONGO_URI
JWT_SECRET
SMTP_*
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
VITE_API_URL
VITE_SOCKET_URL
```

Configure Razorpay's webhook URL as:

```text
https://YOUR-API-DOMAIN/api/payments/webhook
```

Use the same webhook secret in Razorpay and `RAZORPAY_WEBHOOK_SECRET`.
