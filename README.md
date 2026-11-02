# EcoFoodSync – Next.js web app (MySQL + MongoDB)

Web front end and API layer for the EcoFoodSync DBMS Level 3 project (Team G14).

| Layer | Tech |
|---|---|
| Front end + API | Next.js 14 (App Router, Route Handlers) |
| Relational DB | MySQL 8.0 (`ecofoodsync_db`, your existing schema, procedures, triggers, view) |
| NoSQL DB | MongoDB (`ecofoodsync_nosql`) |
| Auth | bcrypt password hashes + signed JWT in an httpOnly cookie |
| Validation | zod (API) + CHECK constraints / triggers (database) |

## Prerequisites
- Node.js 20.6 or newer
- MySQL 8.0 running locally
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string

## Setup

1. **Create the MySQL database** (this drops and recreates `ecofoodsync_db`):
   ```bash
   mysql -u <user> -p < PES2UG24CS660_EcoFoodSync.sql
   mysql -u <user> -p < sql/01_auth_schema.sql      # users table for login
   mysql -u <user> -p < sql/02_demo_fresh_data.sql  # optional: donations that haven't expired
   ```
2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `MYSQL_USER`, `MYSQL_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`) and `SEED_PASSWORD`.
   `.env.local` is git-ignored, so no credentials are ever in the source code.
3. **Install and seed demo users**
   ```bash
   npm install
   npm run seed
   ```
4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

Demo logins (password = the `SEED_PASSWORD` you chose): `admin`, `donor1`, `charity1`, `volunteer1`.
You can also register new DONOR / CHARITY / VOLUNTEER accounts on the login page. ADMIN accounts can only be created by the seed script.

## Roles

| Action | ADMIN | DONOR | CHARITY | VOLUNTEER |
|---|:-:|:-:|:-:|:-:|
| View everything except the audit log | ✔ | ✔ | ✔ | ✔ |
| Add donations | ✔ | ✔ | | |
| Create / change allocations | ✔ | | | |
| Raise / update food requests | ✔ | | ✔ | |
| Assign deliveries | ✔ | | | |
| Update delivery status, log tracking events | ✔ | | | ✔ |
| Add donors / charities / volunteers | ✔ | | | |
| Audit log | ✔ | | | |

Every API route checks the session and role on the server; hiding buttons in the UI is only a convenience.

## Where each database is used (for the report's justification section)

**MySQL – structured, transactional data:** donors, donations, allocations, charities, requests, volunteers, deliveries, users.
Needs primary/foreign keys, CHECK constraints, triggers (over-allocation, expiry), transactions and joins.

**MongoDB – flexible, append-heavy documents:**
- `delivery_events`: tracking timeline per delivery (location pings, delays, issues). Many small writes, varying fields.
- `audit_logs`: who did what and when (login, create, status changes).
- `food_metadata`: per-donation allergens and storage notes. Free-form and different per donation.

## Advanced database features demonstrated

| Feature | Where |
|---|---|
| Stored procedures | `GetAvailableFoodByLocation` (Donations page), `GetDonationAllocationSummary` (Allocations page) |
| Stored function | `GetRemainingDonationQuantity` (Donations list, "Remaining kg") |
| Triggers | Over-allocation rejected on the Allocations page; expiry check on adding a donation |
| Transactions | Assigning a delivery and changing its status each update delivery + volunteer availability atomically (`app/api/deliveries`) |
| View | `vw_active_deliveries` (Dashboard) |
| Full-text search | Donations page search box (`MATCH ... AGAINST` on `food_name`) |
| Indexing | Existing composite / FK / full-text indexes; Mongo indexes created in `lib/mongo.js` |
| NoSQL aggregation | Dashboard: `$group` on events, `$unwind` + `$group` on allergens |

## Project structure
```
app/api/...        Route Handlers (backend/API layer)
app/(app)/...      Pages behind login (dashboard, donations, allocations, deliveries, requests, directory, tracking, audit)
app/login          Login + registration
lib/db.js          MySQL pool        lib/mongo.js   MongoDB client + audit helper
lib/validate.js    zod schemas       lib/api.js     auth/role wrapper + error mapping
lib/session.js     JWT signing       middleware.js  redirects unauthenticated page requests
sql/               extra SQL (users table, optional fresh demo data)
scripts/           seed-users.mjs
```

## Troubleshooting
- **"Available food by location" is empty:** the sample donations expire in Sept 2026. Run `sql/02_demo_fresh_data.sql` or add a donation from the UI with a future expiry.
- **Tracking / audit / dashboard charts show a MongoDB error:** start `mongod` or fix `MONGODB_URI`. MySQL features keep working without it.
- **`ER_ACCESS_DENIED`:** check `MYSQL_USER` / `MYSQL_PASSWORD` in `.env.local`.
