# Flexfit Member Portal

External-facing registration site built with Next.js — deploy to Vercel.

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill:
```
MONGO_URI=mongodb+srv://...    ← same as your backend
JWT_SECRET=...                 ← same as your backend
PORTAL_JWT_EXPIRY=2h
```

### 3. Run locally
```bash
npm run dev    # runs on http://localhost:3001
```

### 4. Deploy to Vercel
```bash
npm install -g vercel
vercel
```

In Vercel dashboard → Settings → Environment Variables, add:
- `MONGO_URI`
- `JWT_SECRET`
- `PORTAL_JWT_EXPIRY` = `2h`

### 5. Logo
Place your logo at `public/images/logo.png`.
Falls back to "FF" text if missing.

## Flow
1. Admin generates 6-digit code in the main app (QR Code page)
2. Member visits portal URL, enters the 6-digit code
3. Code verified against MongoDB → 2h JWT issued
4. Member fills registration form + uploads photo (max 3 MB)
5. Submitted as `activeness: "new"` in MongoDB
6. Admin sees it in Requests page → approves/rejects

## How OTP expiry works
The code has **no built-in expiry** in MongoDB — it stays valid until the
admin refreshes it in the main app. The JWT issued after verification
expires in 2h (configurable via PORTAL_JWT_EXPIRY). After JWT expiry,
the member must enter the code again.
