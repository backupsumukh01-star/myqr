# REST API

Interactive documentation is served at `/docs` (Swagger UI) and `/docs.json`.

## Auth

`POST /api/login`

```json
{ "email": "admin@example.com", "password": "Admin@123" }
```

Returns a JWT. The same token is stored in an httpOnly cookie for the admin UI.

Protected routes accept `Authorization: Bearer <token>` or the session cookie.

`POST /api/logout`  
`GET /api/me`

## QR codes

QR images **always** encode `{website_url}/r/{code}`.  
`redirect_url` is stored in PostgreSQL and resolved on scan. Updating it does **not** change the QR image.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/qr` | Create |
| GET | `/api/qr` | List + search + filter + pagination |
| GET | `/api/qr/:id` | One record |
| PUT | `/api/qr/:id` | title, description, redirect_url, status |
| DELETE | `/api/qr/:id` | Delete |
| GET | `/api/qr/:id/download/png` | PNG download |
| GET | `/api/qr/:id/download/svg` | SVG download |
| POST | `/api/qr/bulk` | `{ "items": [...] }` |
| POST | `/api/qr/import` | multipart CSV `file` |
| GET | `/api/qr/export.csv` | CSV export |

Query params for list: `search`, `status=ACTIVE|DISABLED`, `sort=newest|oldest|scans|title`, `page`, `limit=10|25|50|100`.

## Public redirect

`GET /r/:code`

1. Lookup code  
2. 404 HTML if missing  
3. Disabled page if `DISABLED`  
4. Increment scans, write `scan_logs`, HTTP 302 to latest `redirect_url`

## Dashboard & logs

`GET /api/dashboard/stats`  
`GET /api/dashboard/charts`  
`GET /api/logs`

## Settings

`GET /api/settings`  
`PUT /api/settings` (multipart: `site_name`, `website_url`, `timezone`, `logo`)

Changing `website_url` regenerates **all** QR image files so they still point at the new domain. Destinations are untouched.
