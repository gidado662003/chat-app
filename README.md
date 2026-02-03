<!-- This is for me i pray i don't forget it again -->

# Chat App (ERP Tools)

A real-time chat and ERP tools application built with Next.js (client) and Express/Socket.IO (server). It is designed to be launched from a Laravel ERP: users log in to the Laravel app and are sent here with a token so they stay authenticated.

---

## Laravel ERP Integration

### Overview

- **Laravel ERP** runs on port **8000** (e.g. `http://10.10.253.3:8000`). Users log in there.
- **This project (ERP Tools)** runs separately:
  - **Client (Next.js)** on port **3000** (e.g. `http://10.10.253.3:3000`)
  - **Server (Express)** on port **5001** (e.g. `http://10.10.253.3:5001`)

The Laravel app has a route that links to these ERP tools. When a logged-in user opens that link, Laravel redirects them to the Next.js app **with a token in the URL**. This project then uses that token to authenticate the user without a separate login.

### Application Flow

1. **User logs in to Laravel ERP** (port 8000).
2. **User opens the ERP Tools link** from the Laravel app. Laravel redirects to the Next.js app with a Sanctum token in the query string, for example:

   ```
   http://10.10.253.3:3000/erptool?token=<SANCTUM_TOKEN>
   ```

   (The path can be whatever Laravel uses—e.g. `/erptool`, `/chat`, etc. The client only requires that the URL contains `?token=...`.)

3. **Next.js client (port 3000)** loads. `TokenHandler` (in the root layout) runs on every page and looks for `?token=...` in the URL.

4. **If a token is present:**

   - **Step 1 – Exchange:** The client sends the token to this project’s Express server: `POST /auth/token` with `{ token }`. The server validates the token with Laravel (`GET Laravel_URL/api/user` with `Authorization: Bearer <token>`). If valid, the server sets an `erp_token` cookie and returns success.
   - **Step 2 – Store token on client:** The client stores the token in `sessionStorage` as `erp_token` so it can send it on API requests (e.g. when the cookie is not sent cross-origin).
   - **Step 3 – Sync user:** The client calls `POST /api/user/sync`. The server (using the same token via cookie or `Authorization` header) gets the Laravel user, finds or creates the corresponding user in MongoDB, and returns the synced user. The client stores this user in the auth store (Zustand).
   - **Step 4 – Clean URL:** The client removes the `?token=...` from the URL so the token is not visible in the address bar.

5. **Later requests:** All API calls to the Express server (chats, messages, etc.) send the token via the `Authorization: Bearer <token>` header (and/or the `erp_token` cookie). The server validates the token with Laravel when needed and resolves the MongoDB user for that request.

### What Laravel Needs to Do

- **Provide a link to ERP Tools** that includes the current user’s Sanctum token, for example:
  - `{{ config('app.erp_tools_url', 'http://10.10.253.3:3000') }}/erptool?token={{ auth()->user()->currentAccessToken()->plainTextToken }}`
  - Or the equivalent using your Laravel auth and token API (e.g. if you use a short-lived token generated for this redirect).
- **Expose an API** that this project’s server can call with the token to get the current user. The server expects:
  - **Endpoint:** `GET /api/user`
  - **Auth:** `Authorization: Bearer <token>`
  - **Response:** JSON with at least: `id`, `name`, `email`, and optionally `phone`, `role`, etc. (Laravel’s default `/api/user` with Sanctum fits this.)

### Environment Variables (this project)

- **Server**
  - `LARAVEL_BACKEND_URL` – Base URL of the Laravel app (e.g. `http://10.10.253.3:8000`). Used for token validation and user fetch.
- **Client**
  - No Laravel-specific env vars; the client only needs to receive the URL with `?token=...` and to know the Express server URL (see below) for `/auth/token` and API calls.

---

## Project Structure

```
chat-app/
├── client/          # Next.js frontend
├── server/          # Express/Socket.IO backend
└── README.md
```

## Environment Setup

### Development Setup

1. **Install dependencies for all projects:**

   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**

   **Client (.env.local):**

   - Copy `client/env.example.txt` to `client/.env.local`
   - Update `NEXT_PUBLIC_SOCKET_SERVER_URL` if needed (defaults to `http://localhost:5001`)
   - Update `NEXT_PUBLIC_API_URL` if needed (e.g. `http://localhost:5001/api`)

   **Server (.env):**

   - Copy `server/env.example.txt` (or env.development) to `server/.env`
   - Set `PORT` (default 5001), `CORS_ORIGIN`, `LARAVEL_BACKEND_URL`, `MONGODB_URI`, etc.

3. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both client (port 3000) and server (port 5001) concurrently.

### Production Setup

1. **Build the client:**

   ```bash
   npm run build
   ```

2. **Configure production environment variables:**

   **Client:**

   - Copy `client/env.example.txt` to `client/.env.local` (or use your production env file)
   - Update `NEXT_PUBLIC_SOCKET_SERVER_URL` and `NEXT_PUBLIC_API_URL` to your production server URL

   **Server:**

   - Copy `server/env.example.txt` (or env.production) to `server/.env`
   - Update `CORS_ORIGIN`, `LARAVEL_BACKEND_URL`, `MONGODB_URI`, `PORT`, etc.

3. **Start production servers:**
   ```bash
   npm start
   ```

## Environment Variables

### Client

| Variable                        | Description          | Default                                                                                  |
| ------------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | Express API base URL | `http://localhost:5000/api` (override to match server, e.g. `http://localhost:5001/api`) |
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Socket.IO server URL | `http://localhost:5000` (override to match server, e.g. `http://localhost:5001`)         |

### Server

| Variable              | Description                             | Default                   |
| --------------------- | --------------------------------------- | ------------------------- |
| `PORT`                | Server port                             | `5001`                    |
| `CORS_ORIGIN`         | Allowed CORS origins                    | `*` (all origins)         |
| `LARAVEL_BACKEND_URL` | Laravel ERP base URL (token validation) | `http://10.10.253.3:8000` |
| `MONGODB_URI`         | MongoDB connection string               | (required)                |
| `NODE_ENV`            | Environment mode                        | `development`             |

## Available Scripts

### Root Level

- `npm run install:all` - Install dependencies for all projects
- `npm run dev` - Start both client and server in development
- `npm run build` - Build client for production
- `npm start` - Start both client and server in production

### Client (in client/ directory)

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Server (in server/ directory)

- `npm run dev` - Start with nodemon (auto-restart)
- `npm run start` - Start production server

## Development vs Production

### Development

- Hot reloading enabled
- CORS allows all origins (`*`)
- Client (3000) and server (5001); set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_SERVER_URL` to point at the server (e.g. `http://localhost:5001` and `http://localhost:5001/api`)
- Laravel ERP (8000) must be reachable for token validation, or use a dev bypass (see Laravel Integration above)
- Detailed error messages and logging

### Production

- Optimized builds
- Restricted CORS origins
- Client connects to production server URL
- Minimal error exposure
- Better performance

## Deployment Notes

1. **Environment Variables:** Never commit `.env` files to version control
2. **CORS:** In production, set `CORS_ORIGIN` to your actual client domain(s)
3. **HTTPS:** Use HTTPS in production for secure WebSocket connections
4. **Load Balancing:** If deploying server behind a load balancer, configure sticky sessions for Socket.IO

## Troubleshooting

- **Connection Issues:** Check that both client and server are running and environment variables are set correctly
- **CORS Errors:** Verify `CORS_ORIGIN` matches your client URL in production
- **Port Conflicts:** Ensure the configured ports are available
