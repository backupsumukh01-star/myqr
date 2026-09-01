# Dynamic QR Code Management System

Production-ready Node.js + Express + MySQL app that prints **stable** QR codes.

A QR never contains the destination site. It only contains your domain and a short code:

```
https://mydomain.com/r/abc1
```

On scan, `GET /r/abc1` looks up the latest `redirect_url` in MySQL and issues an HTTP 302. Change the destination in the admin dashboard; the printed QR stays the same.

## Stack

- Node.js, Express, EJS, Bootstrap 5, vanilla JavaScript
- MySQL 8
- JWT (httpOnly cookie + Bearer)
- bcrypt (via bcryptjs)
- `qrcode` for PNG + SVG
- Chart.js, Helmet, CORS, rate limiting, express-validator
- Swagger UI at `/docs`
- Docker Compose

## Quick start (local)

MySQL/MariaDB must be running on port **3306** before migrate/seed/dev. `ECONNREFUSED` means nothing is listening there.

On this Windows setup MariaDB 12.3 is installed at `C:\Program Files\MariaDB 12.3\`. Start it with:

```bash
npm run db:start
```

1. Create a MySQL server and copy environment config:

```bash
cp .env.example .env
```

Set `DB_PASSWORD`, `JWT_SECRET`, and `APP_BASE_URL` (the public origin encoded into every QR).

2. Install and migrate:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

3. Open [http://localhost:3000/login](http://localhost:3000/login)

Default admin (from `.env`):

- Email: `admin@example.com`
- Password: `Admin@123`

Change these immediately in production.

## Docker

```bash
docker compose up --build
```

The app container applies `database/schema.sql` on first MySQL boot. Then:

```bash
docker compose exec app npm run seed
```

## How a scan works

1. Phone camera opens `APP_BASE_URL/r/{code}` (any Android or iPhone camera that supports QR URLs).
2. Backend loads the row from `qr_codes`.
3. Missing → 404 page. `DISABLED` → disabled page.
4. `ACTIVE` → increment `scan_count`, set `last_scanned_at`, insert `scan_logs`, **302** to `redirect_url`.

Updating `redirect_url` never regenerates the QR. Regenerating images only happens if you change **Website URL** in Settings (the domain printed inside the QR).

## Project layout

```
src/config controllers models routes middleware services helpers utils validators
public/css js images
views/
uploads/qr  uploads/logo
database/schema.sql
docs/
```

## Admin UI

- Dashboard cards + daily/monthly charts + top 10 + recent activity
- QR table: preview, search, status filter, most scanned / newest / oldest, pagination 10/25/50/100
- View / edit / delete / download PNG & SVG / copy short URL / enable-disable
- Bulk JSON generation and CSV import/export
- Scan logs
- Settings: site name, website URL, logo, timezone
- Dark mode

## Security

- Helmet, CORS, login + API rate limits
- Parameterized SQL (mysql2) — no string-concatenated queries
- express-validator + input sanitization
- Secrets in `.env`
- Short codes are unique; duplicate creates are rejected

## License

MIT
