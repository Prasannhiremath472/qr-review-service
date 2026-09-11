# qr-review-service

QR-code-based Google Review collection service, split into two independently deployable apps for Hostinger:

- **`backend/`** — Node.js + Express + Prisma API (MySQL)
- **`frontend/`** — Vite + React single-page app

## Local development

### Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL (MySQL), QR_BASE_URL, JWT_SECRET, GEMINI_API_KEY, etc.
npm install
npx prisma migrate dev --name init   # creates tables in your MySQL database
SEED_ADMIN_EMAIL=admin@yourdomain.com SEED_ADMIN_PASSWORD=your-strong-password npm run seed:admin
npm run dev                          # starts on PORT (default 8098)
```

The seed script creates the first ADMIN account (there's no public sign-up — admins create every other account from the Admin Panel). Log in and create your salesman/owner accounts from there.

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_BASE_URL to your backend URL (e.g. http://localhost:8098)
npm install
npm run dev
```

## Deploying to Hostinger

### Backend (Node.js app / VPS)

1. Create a MySQL database in hPanel (phpMyAdmin) and note the host, user, password, database name.
2. Upload the `backend/` folder to your Node.js app (Hostinger's Node.js hosting or a VPS).
3. Set environment variables (via Hostinger's Node app config or a `.env` file):
   - `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DBNAME"`
   - `QR_BASE_URL="https://api.yourdomain.com"` (this backend's own public URL — used only for the `/qr-image/:id` PNG endpoint)
   - `FRONTEND_URL="https://yourdomain.com"` (your frontend's public URL — encoded into every QR code and used for scan links, since `/r/:qrId` is a page on the frontend, not the backend)
   - `CORS_ORIGIN="https://yourdomain.com"` (your frontend's public URL, for CORS)
   - `JWT_SECRET` (a long random string — required; generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `GEMINI_API_KEY` (optional — falls back to canned reviews if omitted)
   - `PORT` (Hostinger usually sets this automatically)
4. Install dependencies, run migrations, and seed the first admin on the server:
   ```bash
   npm install
   npx prisma migrate deploy
   SEED_ADMIN_EMAIL=admin@yourdomain.com SEED_ADMIN_PASSWORD=your-strong-password npm run seed:admin
   npm start
   ```

### Frontend (static hosting)

1. Set `VITE_API_BASE_URL` in `frontend/.env` to your deployed backend URL, then build:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Upload the contents of `frontend/dist/` to your Hostinger website's `public_html` (or a subdomain).
3. The included `public/.htaccess` (copied into `dist/` on build) enables client-side routing so links like `/r/:qrId` and `/dashboard/:shopId` work directly.

## How it works

- **Roles**: `ADMIN` (creates all accounts, full access), `SALESMAN` (bulk-creates and activates QR codes, can view any shop's dashboard), `OWNER` (can only view/print their own shop's dashboard). There's no public sign-up — an admin creates every account from `/admin`.
- Admin/salesman pre-print QR codes (unlinked) via the Admin Panel or `POST /api/v1/qr-reviews/qr/bulk`.
- Scanning an unlinked QR at `/r/:qrId` prompts the salesman/admin to log in, then shows an activation form; submitting it creates a shop and links the QR (optionally linking a pre-created OWNER account to that shop).
- Scanning a linked QR shows a star-rating review page (no login needed — this is the public customer-facing flow). Ratings of 4-5 generate an AI-written Google Review (via Gemini) that the customer copies and pastes on Google; ratings below 4 are captured as private feedback instead of being sent to Google.
- `/dashboard/:shopId` (login required) lists all QR codes for a shop with scan counts, for printing/downloading.
