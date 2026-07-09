# Raqi Admin Dashboard

Simple React admin dashboard for the Raqi API.

## What it does

- Logs in through `POST /api/v1/auth/login`
- Uses JWT Bearer token for admin endpoints
- Shows data from:
  - `GET /api/v1/admin/reports/overview`
  - `GET /api/v1/admin/users`
  - `GET /api/v1/admin/customers`
  - `GET /api/v1/admin/drivers`
  - `GET /api/v1/admin/tasks`
- Refreshes automatically every 10 seconds so API updates are reflected

## Run locally

1. Run backend API from `raqi`:

```bash
npm install
npm run start:dev
```

2. Run dashboard from `raqi-admin`:

```bash
npm install
npm run dev
```

3. Open:

- http://localhost:5173

## Default admin credentials

- Email: `admin@raqi.local`
- Password: `Admin@123`
