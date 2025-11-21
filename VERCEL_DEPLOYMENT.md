# Vercel Monorepo Deployment Guide

This guide explains how to deploy the SubTrack monorepo to Vercel with **zero CORS** and a single domain.

## Architecture

- **Frontend**: Vite + React app (static build)
- **Backend**: Express.js API (serverless functions)
- **Domain**: `https://subtrack.vercel.app` (single domain for both)
- **API Routes**: `/api/*` → serverless function
- **Frontend Routes**: `/*` → static files

## Repository Structure

```
subtrack/
├── frontend/          # Vite React app
│   ├── src/
│   ├── dist/          # Build output (generated)
│   └── package.json
├── backend/           # Express API
│   ├── src/
│   ├── dist/          # Build output (generated)
│   └── package.json
├── api/               # Vercel serverless wrapper
│   └── index.ts       # Express app export
├── vercel.json        # Vercel configuration
└── package.json       # Root package.json
```

## How It Works

1. **Build Process**:
   - Backend is built first: `cd backend && npm install && npm run build`
   - Frontend is built second: `cd frontend && npm install && npm run build`
   - Backend compiles TypeScript to `backend/dist/`
   - Frontend builds static files to `frontend/dist/`

2. **Routing**:
   - Requests to `/api/*` are routed to `api/index.ts` (serverless function)
   - All other requests (`/*`) are served from `frontend/dist/` (static files)
   - Frontend uses relative URLs (`/api/...`) for API calls = **zero CORS**

3. **Serverless Function**:
   - `api/index.ts` imports the compiled Express app from `backend/dist/`
   - Vercel includes `backend/dist/**` in the serverless function bundle
   - Express app handles all `/api/*` routes

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure Vercel monorepo deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the `vercel.json` configuration

### 3. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Backend Variables:**
```
MONGO_URI=mongodb+srv://...
ENCRYPTION_KEY=your-32-char-secret
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@subtrack.app
NODE_ENV=production
```

**Frontend Variables:**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
# DO NOT SET VITE_API_URL - use relative URLs for zero CORS
```

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies for both frontend and backend
2. Build backend (`npm run build` in `backend/`)
3. Build frontend (`npm run build` in `frontend/`)
4. Deploy frontend as static files
5. Deploy backend as serverless function

## Zero CORS Configuration

Since both frontend and backend are on the same domain (`subtrack.vercel.app`), there's **no CORS needed**:

- Frontend makes requests to `/api/users`, `/api/connections`, etc.
- Browser automatically uses the same origin
- No `Access-Control-Allow-Origin` headers needed
- No preflight OPTIONS requests

The `api/index.ts` still includes CORS middleware for safety, but it allows same-origin requests automatically.

## API Routes

All API routes are available at:
- `https://subtrack.vercel.app/api/users/*`
- `https://subtrack.vercel.app/api/connections/*`
- `https://subtrack.vercel.app/api/scan/*`
- `https://subtrack.vercel.app/api/stripe/*`
- `https://subtrack.vercel.app/api/waitlist/*`
- `https://subtrack.vercel.app/api/notifications/*`

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '../backend/dist/...'`

**Solution**: Make sure `backend/package.json` has `"postinstall": "npm run build"` or the build command includes backend build.

### API Returns 404

**Error**: `/api/users` returns 404

**Solution**: 
1. Check that `api/index.ts` exists and exports the Express app
2. Verify `vercel.json` has the correct rewrite rule for `/api/(.*)`
3. Check Vercel function logs for errors

### CORS Errors

**Error**: `Access-Control-Allow-Origin` errors

**Solution**: 
1. Make sure `VITE_API_URL` is **NOT** set in Vercel environment variables
2. Frontend should use relative URLs (`/api/...`)
3. Check that `api/index.ts` has CORS configured to allow same origin

### Database Connection Issues

**Error**: MongoDB connection fails

**Solution**:
1. Verify `MONGO_URI` is set in Vercel environment variables
2. Check MongoDB Atlas IP whitelist (allow all IPs or Vercel IPs)
3. Check serverless function logs for connection errors

## Local Development

For local development, use separate servers:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Frontend will use `http://localhost:5000/api` for API calls (configured in `frontend/src/lib/api.ts`).

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] `VITE_API_URL` is **NOT** set (use relative URLs)
- [ ] Backend builds successfully (`backend/dist/` exists)
- [ ] Frontend builds successfully (`frontend/dist/` exists)
- [ ] MongoDB Atlas allows Vercel IPs
- [ ] Stripe webhook URL updated to `https://subtrack.vercel.app/api/stripe/webhook`
- [ ] Clerk production keys are used (`pk_live_...`, `sk_live_...`)
- [ ] Custom domain configured (optional)

## Benefits of This Setup

✅ **Zero CORS** - Same domain for frontend and backend  
✅ **Single Deployment** - One Vercel project, one domain  
✅ **Fast Builds** - Parallel builds, cached dependencies  
✅ **Serverless Scaling** - Backend scales automatically  
✅ **Free Tier** - Vercel free tier covers most use cases  
✅ **Easy Updates** - Git push = automatic deployment  

---

**Ready to deploy?** Push to GitHub and connect to Vercel! 🚀

