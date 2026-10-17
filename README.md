# Desk

Front desk for the gym API. Sign in, check a member in, and see plans ending this week.

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173` and calls `VITE_API_URL` (default `http://localhost:3000`). The API must allow that origin in `CORS_ORIGIN`.
