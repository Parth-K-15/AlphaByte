# Finance Ledger (Supabase Postgres) — Setup

## 1) Create tables in Supabase
- Open Supabase → SQL Editor
- Paste and run: `Server/sql/finance_ledger.sql`

This creates:
- `public.finance_transactions` (append-only)
- `public.finance_approvals`
- view `public.finance_event_balances`

## 2) Configure backend env
In `Server/.env` set:

- `SUPABASE_URL=https://<ref>.supabase.co`
- `SUPABASE_ANON_KEY=eyJ...` (from Dashboard → Settings → API)

The finance ledger uses the **Supabase REST API** (HTTPS, port 443).
This avoids firewall issues with direct Postgres TCP connections.

Do **not** commit `.env`.

## 3) Verify connection + tables
Run:
- `node scripts/check-finance-ledger-postgres.js`

Expected:
- "Supabase connected (HTTPS, port 443)"
- All three objects reachable

## 4) Use API routes
Mounted under:
- `/api/finance/ledger/*`

Protected by JWT + roles (`ADMIN`, `TEAM_LEAD`).

Endpoints:
- `POST /api/finance/ledger/transactions`
- `POST /api/finance/ledger/transactions/:id/reverse`
- `GET /api/finance/ledger/events/:eventId/balance`
- `GET /api/finance/ledger/events/:eventId/transactions`
