# DB Best Worlds 🌍

> India's first honest travel planning & booking platform — trains, hotels, cabs, one place.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion |
| Backend | Fastify + TypeScript + Prisma ORM |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 + BullMQ |
| Real-time | Socket.io (WebSocket) |
| Payments | Razorpay (stubbed — add keys to activate) |

## Quick Start

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Clone & install

```bash
git clone <repo-url>
cd travel
npm install
```

### 3. Environment setup

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env
# Edit apps/api/.env — fill in JWT secrets at minimum
```

### 4. Start Postgres + Redis

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init --schema src/prisma/schema.prisma
cd ../..
```

### 6. Start dev servers

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Web (port 5173)
npm run dev:web
```

Open http://localhost:5173

## Key URLs

| URL | Description |
|---|---|
| `http://localhost:5173` | Frontend |
| `http://localhost:4000/health` | API health check |
| `http://localhost:4000/api/v1` | REST API base |
| `ws://localhost:4000/ws` | WebSocket |
| `http://localhost:5555` | Prisma Studio (run `npm run studio --workspace=apps/api`) |

## User Flow

1. Register → OTP (check API console for OTP in dev) → Login
2. Plan a trip (Destination → Dates → Budget)
3. Pick a plan (Budget Explorer / Balanced / Comfort Plus)
4. Review itemized price → Proceed to Book
5. Live booking progress via WebSocket
6. Confirmation page with vendor contacts

## Ops / Admin Flow

1. Create a user with role `SUPPORT` or `ADMIN` in Prisma Studio
2. Log in as that user → `/ops` link appears in navbar
3. See pending bookings, claim tasks, mark confirmed/failed

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key ones to fill in:

| Variable | Required for |
|---|---|
| `JWT_ACCESS_SECRET` | JWT auth (any random string ≥32 chars) |
| `JWT_REFRESH_SECRET` | Refresh tokens |
| `RAZORPAY_KEY_ID` + `_SECRET` | Payments (stub works without these) |
| `GOOGLE_CLIENT_ID` | Google OAuth (stub works without) |
| `TWILIO_*` | Real OTP SMS (console log used in dev) |

## Architecture

See [DB-Best-Worlds-Spec.md](../../d:/download/DB-Best-Worlds-Spec.md) for the full spec.

```
travel/
├── apps/
│   ├── web/          # React 18 + Vite frontend
│   └── api/          # Fastify backend
│       └── src/
│           ├── modules/auth|trips|bookings|vendors|ops|notifications
│           ├── jobs/          # BullMQ queues
│           ├── ws/            # Socket.io gateway
│           └── prisma/        # Schema + migrations
├── docker-compose.yml
└── .env.example
```
