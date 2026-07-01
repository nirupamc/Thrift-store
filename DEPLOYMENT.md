# Deployment Guide

ThriftBazaar deploys on **Render** (API) + **Neon** (Postgres) + **Upstash** (Redis) + **Vercel** (Next.js frontend).

---

## Step 1 — Setup Neon (Postgres)

1. Create a free account at [neon.tech](https://neon.tech)
2. Click **New Project**, choose a region close to your Render region
3. Once created, go to **Dashboard → Connection Details**
4. Copy the **Connection string** (starts with `postgresql://...`)
5. Save it — this is your `DATABASE_URL`

---

## Step 2 — Setup Upstash (Redis)

1. Create a free account at [upstash.com](https://upstash.com)
2. Click **Create Database**, choose **Redis**, pick a region
3. After creation, go to the database page
4. Under **REST API** or **Details**, copy the **Redis URL** (starts with `rediss://...`)
5. Save it — this is your `REDIS_URL`

---

## Step 3 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render will detect `render.yaml` automatically
4. In the **Environment Variables** panel, add all `sync: false` variables:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `REDIS_URL` | Your Upstash Redis URL |
   | `JWT_ACCESS_SECRET` | A random 64-char string |
   | `JWT_REFRESH_SECRET` | A different random 64-char string |
   | `RAZORPAY_KEY_ID` | From Razorpay dashboard |
   | `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
   | `RAZORPAY_WEBHOOK_SECRET` | From Razorpay dashboard |
   | `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
   | `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
   | `FRONTEND_URL` | Your Vercel URL (add after Step 5) |

5. Click **Apply** — Render builds the Docker image and starts the service
6. The `entrypoint.sh` automatically runs `prisma migrate deploy` on every deploy

> **Generate secure secrets:**
> ```sh
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run twice to get two different values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## Step 4 — Verify Database Migration

After the first deploy, check Render's **Logs** tab. You should see:

```
Running database migrations...
Prisma Migrate: No pending migrations
Starting server...
Server running on port 5000
```

If migrations failed, open the Render **Shell** tab and run:
```sh
npx prisma migrate deploy
```

---

## Step 5 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://thriftbazaar-api.onrender.com/api/v1` |

   Replace `thriftbazaar-api` with your actual Render service name.

5. Click **Deploy**
6. Once deployed, copy your Vercel URL (e.g. `https://thriftbazaar.vercel.app`)

---

## Step 6 — Wire Up FRONTEND_URL on Render

1. Go back to Render → your service → **Environment**
2. Set `FRONTEND_URL` to your Vercel URL (e.g. `https://thriftbazaar.vercel.app`)
3. Click **Save Changes** — Render redeploys automatically
4. This allows CORS requests from your Vercel frontend to reach the API

---

## Environment Files Reference

**Backend** — set directly in Render's environment panel (not committed to git):
```
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=5000
```

**Frontend** — set in Vercel's environment variable settings:
```
NEXT_PUBLIC_API_URL=https://thriftbazaar-api.onrender.com/api/v1
```

---

## Notes

- **Image uploads**: Render's filesystem is ephemeral (resets on deploy). All production uploads go through Cloudinary, which is already configured as the upload target in `src/config/cloudinary.ts`. Local `/uploads` only works in development.
- **Cold starts**: Free Render services spin down after 15 min of inactivity. The first request after a cold start takes ~30s. Upgrade to a paid plan to avoid this.
- **Database migrations**: `entrypoint.sh` runs `prisma migrate deploy` on every container startup. This is safe — it's idempotent and only applies pending migrations.
