# Simple Deployment Guide - Frontend & Backend Separately

## Architecture

- **Frontend**: Deployed on Vercel (static site)
- **Backend**: Deployed on Railway (API server)
- **Zero CORS**: Frontend calls backend via `VITE_API_URL` environment variable

## Why This Approach?

✅ **No Node.js version conflicts** - Each service uses its own Node version  
✅ **Simpler configuration** - No complex monorepo build setup  
✅ **Better separation** - Frontend and backend can scale independently  
✅ **Easier debugging** - Clear separation of concerns  

## Deployment Steps

### 1. Deploy Backend on Railway

1. Go to [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Set **Root Directory** to `backend`
4. Add environment variables (see `ENV_VARIABLES.md`)
5. Deploy!

Backend will be available at: `https://your-backend.railway.app`

### 2. Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Vercel will auto-detect Vite
5. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key
   - `VITE_API_URL` = `https://your-backend.railway.app/api` (your Railway backend URL)
6. Deploy!

Frontend will be available at: `https://your-app.vercel.app`

## Environment Variables

### Vercel (Frontend)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-backend.railway.app/api
```

### Railway (Backend)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
ENCRYPTION_KEY=your-32-char-secret
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@subtrack.app
CLIENT_URL=https://your-app.vercel.app
```

## CORS Configuration

The backend is already configured to allow your Vercel domain. Make sure `CLIENT_URL` in Railway matches your Vercel domain.

## Benefits

- ✅ No build conflicts
- ✅ Independent scaling
- ✅ Easier to debug
- ✅ Can update frontend/backend independently
- ✅ Railway handles backend Node.js version automatically
- ✅ Vercel handles frontend build automatically

## Testing

1. Frontend: `https://your-app.vercel.app`
2. Backend API: `https://your-backend.railway.app/api/health`

Both should work independently!

