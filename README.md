# goit-node-rest-api

## Prerequisites
- Node.js 18+ (uses ES modules)
- PostgreSQL database or Docker (for tests via Testcontainers)
- Environment variables for DB connection (see below)

## Environment Variables
Set these in a `.env` file or your shell:
- `DB_NAME` – database name
- `DB_USER` – database user
- `DB_PASSWORD` – database password
- `DB_HOST` – database host (default `localhost`)
- `DB_PORT` – database port (default `5432`)

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
