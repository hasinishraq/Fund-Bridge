# FundBridge Frontend

FundBridge Frontend is a React (Vite) single-page app that surfaces the Spring Boot APIs used for authentication, loans, wallets, and admin oversight. It ships with a role-aware dashboard, borrower workflows, wallet management, and admin observability out of the box.

## Features
- Protected routes backed by a global auth context and API-powered session bootstrap
- Borrower workspace for applying for loans, tracking statuses, and managing wallet balance & transactions
- Admin dashboard that surfaces user/loan metrics and pending approvals
- Centralized Axios client with token injection + automatic 401 cleanup
- Shared UI primitives (buttons, modal, loader) and responsive dashboard layout

## Tech Stack
- [Vite](https://vitejs.dev) + React 18
- React Router v6
- Axios for HTTP requests
- PropTypes for runtime prop validation

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the sample environment values and point the frontend at your Spring Boot gateway
   ```bash
   cp .env .env.local # (or edit .env directly)
   ```
   ```dotenv
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
3. Run the dev server
   ```bash
   npm run dev
   ```
4. Build for production
   ```bash
   npm run build
   ```

## Project Structure
```
frontend/
├─ public/
│  └─ index.html
├─ src/
│  ├─ api/              # Axios client + domain API helpers
│  ├─ components/
│  │  ├─ auth/          # Login & register forms
│  │  ├─ common/        # Button, modal, loader
│  │  └─ layout/        # Navbar, sidebar, dashboard shell
│  ├─ context/          # AuthProvider & hook
│  ├─ pages/            # Route-level screens
│  ├─ routes/           # Route guards (PrivateRoute)
│  ├─ utils/            # Constants & validators
│  ├─ App.jsx           # Router setup
│  └─ main.jsx          # Entry point
├─ .env                 # API base URL (Vite prefixed)
├─ package.json
└─ README.md
```

## Available Scripts
- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build locally

## Backend Integration Notes
- The frontend assumes the Spring Boot backend issues JWT tokens via `/auth/login` and `/auth/register` and exposes `/auth/me` for profile fetching.
- Update `.env` if your API gateway path differs.
- For production, serve the `dist` folder behind the same domain as the backend or configure CORS/credentials appropriately.
