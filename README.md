# ThriftBazaar 

> India's multi-vendor thrift marketplace — where pre-loved fashion finds new homes.

**Live Demo:** [thrift-store-ncng.vercel.app](https://thrift-store-ncng.vercel.app)  
**API Docs:** [thrift-store-9h66.onrender.com/api/v1/docs](https://thrift-store-9h66.onrender.com/api/v1/docs)

---

## What is ThriftBazaar?

Indian thrift culture lives on Instagram — vendors post drops, buyers scramble to DM first, payments happen over UPI screenshots. It's chaotic. ThriftBazaar fixes this.

It's a full-stack marketplace where thrift vendors get their own customizable storefront (think MySpace meets Shopify), buyers can discover and purchase unique vintage finds, and an admin panel keeps the platform running cleanly.

---

## Features

**For Buyers**
- Browse products with rich filters (rarity, era, fabric, gender, brand, city)
- Real-time drop alerts — follow stores and get notified the moment new stock drops
- Multi-vendor cart — buy from multiple stores in one checkout
- Razorpay payment integration
- Order tracking with per-vendor sub-order status

**For Vendors**
- MySpace-style storefront customization (banner color/gradient/image, background patterns, stickers, marquee text, custom fonts, page effects)
- Rich product listings (condition, rarity, era, fabric, measurements, defects — honest metadata)
- Drop scheduling with Socket.io real-time notifications to followers
- Vendor dashboard with revenue, sales, rating, and follower stats

**For Admins**
- Platform-wide overview (total revenue, orders, vendors, buyers)
- Vendor approval and suspension controls
- Payout management
- Full order visibility

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Cache & Sessions | Redis (Upstash in production) |
| Auth | JWT (access + refresh tokens) |
| Payments | Razorpay with multi-vendor split |
| Real-time | Socket.io |
| File Uploads | Local storage (dev) / Cloudinary (prod) |
| Containerization | Docker + Docker Compose |
| API Docs | Swagger / OpenAPI |
| Frontend | Next.js 14 + Tailwind CSS |
| Animations | Framer Motion |
| State Management | Zustand + React Query |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Architecture Decisions

**Multi-vendor cart splitting**
A single cart checkout splits into one `SubOrder` per vendor automatically. Each vendor manages their own fulfillment independently. Payment splits at the Razorpay level using the Route API.

**Race condition handling on 1-of-1 inventory**
Thrift items are unique — two buyers clicking "Buy" simultaneously could both succeed without protection. The `markProductSold` function uses Prisma's `$transaction` with `SELECT ... FOR UPDATE`, acquiring a row-level lock. The second concurrent request blocks, then reads `isAvailable: false` and throws a `ConflictError`.

**JWT refresh token rotation with Redis**
Access tokens expire in 15 minutes. Refresh tokens (7 days) are stored in Redis under `tb:refresh:{userId}`. On every refresh, the old token is deleted and a new one issued — preventing replay attacks. If the refresh token is missing from Redis (e.g. after logout), the refresh fails even if the JWT signature is valid.

**Redis cart**
Cart data lives in a Redis hash (`tb:cart:{userId}`) with a 30-day TTL. O(1) operations per item, auto-cleanup, and instant clear on checkout. No database writes until an order is placed.

**Real-time drop notifications**
Buyers who follow a store are auto-joined to a Socket.io room (`store:{storeId}`) on connect. When a vendor schedules a drop, the server emits `drop:scheduled` to that room — all followers get an instant notification without polling.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@thriftbazaar.in | Admin@123 |
| Vendor | retro.raj@example.com | Vendor@123 |
| Buyer | demo.buyer@example.com | Buyer@123 |

---

## Local Setup

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### 1. Clone the repo
```bash
git clone https://github.com/nirupamc/Thrift-store.git
cd Thrift-store
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Fill in `.env`:
```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

DATABASE_URL=postgresql://thrift_user:thrift_pass@localhost:5433/thrift_bazaar

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret

PLATFORM_FEE_PERCENT=10
```

### 3. Start Docker (Postgres + Redis)
```bash
docker compose up postgres redis -d
```

### 4. Run database migrations and seed
```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the backend
```bash
npm run dev
```

Backend runs at `http://localhost:5000`  
API docs at `http://localhost:5000/api/v1/docs`

### 6. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_HOST` | Redis host (local dev) | ✅ |
| `REDIS_URL` | Redis URL (production/Upstash) | Production only |
| `JWT_ACCESS_SECRET` | Secret for access tokens | ✅ |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | ✅ |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (e.g. 15m) | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. 7d) | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay API key | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | ✅ |
| `PLATFORM_FEE_PERCENT` | Platform commission % | ✅ |
| `FRONTEND_URL` | Allowed CORS origin | Production only |

---

## API Overview

32+ endpoints across 9 modules. Full documentation at `/api/v1/docs`.

| Module | Endpoints |
|---|---|
| Auth | Register, login, refresh, logout |
| Products | CRUD, rich filtering, slug lookup |
| Stores | Create, customize, stats, follow/unfollow |
| Cart | Add, remove, clear (Redis-backed) |
| Orders | Checkout, Razorpay verify, order history |
| Reviews | Post-delivery reviews, store/product ratings |
| Drops | Schedule drops, real-time notifications |
| Admin | Platform stats, vendor/buyer management, payouts |
| Categories | List all categories |

---

## Folder Structure

```
Thrift-store/
├── src/
│   ├── modules/          # Feature modules (auth, products, stores, etc.)
│   ├── middleware/        # protect, validate, rateLimiter, errorHandler
│   ├── config/            # env, database, redis, storage
│   └── utils/             # AppError, asyncHandler, jwt, logger
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── frontend/              # Next.js app
│   ├── app/               # App Router pages
│   ├── components/        # Reusable components
│   ├── lib/               # API client, types, utils
│   └── store/             # Zustand stores
├── docker-compose.yml
├── Dockerfile
└── entrypoint.sh
```

---

## Deployment

| Service | Platform |
|---|---|
| Backend | Render (Docker) |
| Frontend | Vercel |
| Database | Neon (PostgreSQL) |
| Redis | Upstash |

---

## License

MIT

---

Built with ❤️ for India's thrift community.
