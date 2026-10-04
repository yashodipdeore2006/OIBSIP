# PizzaCraft Client

React 19 + Vite frontend for the PizzaCraft custom pizza ordering and admin system.

## Environment

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Vite exposes `VITE_*` values to browser code. Do not place secrets in these variables.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

For deployment, set `VITE_API_URL` and `VITE_SOCKET_URL` to the public HTTPS API and Socket.IO URLs before the build.
