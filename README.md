# goit-node-rest-api

## Prerequisites
- Node.js 18+ (uses ES modules)
- PostgreSQL database or Docker (for tests via Testcontainers)
- Environment variables for DB connection (see below)

## Environment Variables
Set these in a `.env` file or your shell:
- `DB_NAME` - database name
- `DB_USER` - database user
- `DB_PASSWORD` - database password
- `DB_HOST` - database host (default `localhost`)
- `DB_PORT` - database port (default `5432`)
- `DB_SSL` - use SSL for DB connection (`true`/`false`, default `false`)
- `JWT_SECRET` - secret for signing JWTs (default fallback exists, set your own)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` - SMTP credentials for sending mail (nodemailer)
- `SMTP_SECURE` - `true`/`false` for secure connection (default `true`)
- `SMTP_FROM` - optional “from” address (defaults to `SMTP_USER`)

## Install
```bash
npm install
```

## Run the API
```bash
npm start
```
Starts the server on port `3000` after establishing a Sequelize connection. On success, you'll see `Database connection successful`.

## Tests
Integration tests use Testcontainers (Docker required):
```bash
npm test
```
Docker must be running; tests will start a temporary Postgres container automatically. If Docker is unavailable, tests will fail rather than falling back.

## Contacts Routes
- `GET /api/contacts`
- `GET /api/contacts/:id`
- `POST /api/contacts` (`name`, `email`, `phone`, optional `favorite`)
- `PUT /api/contacts/:id` (any subset of fields)
- `PATCH /api/contacts/:contactId/favorite` (`favorite` required)
- `DELETE /api/contacts/:id`

## Auth Routes
- `POST /api/auth/register` — body: `{ email, password }`
- `POST /api/auth/login` — body: `{ email, password }`; returns `{ token, user }`
- `POST /api/auth/logout` — requires `Authorization: Bearer <token>`
- `GET /api/auth/current` — requires auth; returns `{ email, subscription }`
- `PATCH /api/auth/subscription` — requires auth; body: `{ subscription }` with one of `starter|pro|business`
- `PATCH /api/auth/avatars` — multipart/form-data with `avatar` file; requires auth; updates `avatarURL`
- `GET /api/auth/verify/:verificationToken` — email verification link
- `POST /api/auth/verify` — body: `{ email }`; resends verification email if not verified

All contacts routes require auth; contacts are scoped per user (owner). Pagination/filtering: `GET /api/contacts?page=1&limit=20&favorite=true`.

Static avatars are served from `/avatars/...`; uploaded files are stored under `public/avatars`, incoming files land in `temp/` before being moved.
