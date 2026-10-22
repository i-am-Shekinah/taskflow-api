# TaskFlow API

Task management API — MVP 1.0. Authenticated, per-user task CRUD on MongoDB.

**Stack:** TypeScript · Express 5 · Mongoose 9 · Zod · JWT (jsonwebtoken) · bcryptjs

## Getting started

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | no* | Full MongoDB connection string |
| `MONGODB_URI` + `MONGODB_USERNAME` + `MONGODB_PASSWORD` | no* | Atlas-export style; placeholders in the URI are substituted at startup |
| `JWT_SECRET` | yes | ≥16 chars; signs access tokens |
| `PORT` | no | Defaults to `3000` |

\* At least one Mongo option must be set; otherwise it falls back to `mongodb://127.0.0.1:27017/taskflow`.

## API

All responses use JSON. Errors follow one shape:

```json
{ "error": { "code": "task_not_found", "message": "Task not found" } }
```

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password (≥8 chars), name? }` → `201 { token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `200 { token, user }` |

Tokens are JWTs valid for 7 days. Send them as `Authorization: Bearer <token>`. Auth endpoints are rate-limited.

### Tasks (all require a token; you only ever see your own)

| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks` | List with `?status&priority&page&limit&sort` → `{ data, page, limit, total }` |
| POST | `/api/tasks` | `{ title, description?, status?, priority?, dueDate? }` → `201` |
| GET | `/api/tasks/:id` | Fetch one → `200`, or `404` if missing/not yours |
| PATCH | `/api/tasks/:id` | Partial update, at least one field → `200` |
| DELETE | `/api/tasks/:id` | → `204` |

**Task fields:** `status`: `todo` \| `in_progress` \| `done` (default `todo`) · `priority`: `low` \| `medium` \| `high` (default `medium`) · `sort`: `-createdAt` (default), `createdAt`, `dueDate`, `-dueDate` · `limit`: 1–100, default 20.

### Example

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -s -X POST localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Ship MVP","priority":"high","dueDate":"2026-11-01"}'
```

## Project layout

```
src/
  server.ts              entrypoint: env → Mongo → listen
  app.ts                 createApp() factory (no side effects; used by tests)
  config/env.ts          zod-validated environment, Atlas URI placeholder support
  db/connection.ts       mongoose connect/disconnect
  middleware/            JWT guard + central error handler
  models/                user (hashed password), task (owner-scoped)
  modules/auth/          register/login + zod schemas + jwt helpers
  modules/tasks/         CRUD controllers + zod schemas, owner-scoped queries
tests/                   supertest + vitest against mongodb-memory-server
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | watch mode via tsx |
| `npm start` | run once |
| `npm test` | integration tests (spin up a throwaway in-memory MongoDB; no Atlas creds needed) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome lint (typescript-eslint does not yet support TypeScript 7) |

## Notes

- No refresh tokens yet — a 7-day access token is the whole session story for MVP 1.0.
- Deletes are hard deletes.
- Email verification and password reset are out of scope for this stage.
