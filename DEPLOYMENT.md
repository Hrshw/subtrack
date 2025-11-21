# Deployment Guide - SubTrack

This guide will help you deploy SubTrack to production:
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: MongoDB Atlas

---

## 📋 Prerequisites

1. **GitHub Account** (for version control)
2. **Vercel Account** (free tier available)
3. **Railway Account** (free tier available)
4. **MongoDB Atlas Account** (free tier available)
5. **Clerk Account** (for authentication)
6. **Stripe Account** (for payments)
7. **Google Cloud Account** (for Gemini API)

---

## 🚀 Step 1: Prepare Your Codebase

### 1.1 Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Production ready"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/subtrack.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier M0)
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for Railway)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/subtrack?retryWrites=true&w=majority
   ```

---

## ⚙️ Step 3: Deploy Backend to Railway

### 3.1 Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `backend` folder as the root directory

### 3.2 Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/subtrack?retryWrites=true&w=majority

# Clerk
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# Client URL (will be set after frontend deployment)
CLIENT_URL=https://your-app.vercel.app
# Optional: comma-separated extra origins for preview deployments
# CLIENT_URLS=https://preview-1.vercel.app,https://preview-2.vercel.app

# Encryption Key (generate a secure 32+ character string)
ENCRYPTION_KEY=your_secure_random_32_character_key_here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Resend (Optional)
RESEND_API_KEY=re_your_resend_api_key
```

### 3.3 Deploy

1. Railway will automatically detect the build process
2. It will run `npm install` → `npm run build` → `npm start`
3. Wait for deployment to complete
4. Copy your Railway backend URL (e.g., `https://subtrack-backend.railway.app`)

### 3.4 Configure Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **Generate Domain** or add your custom domain
3. Update `CLIENT_URL` if needed

---

## 🎨 Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Project

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4.2 Configure Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables**:

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key

# API URL (REQUIRED - your Railway backend URL from Step 3.3)
VITE_API_URL=https://your-backend.railway.app
```

**Important**: Replace `https://your-backend.railway.app` with your actual Railway backend URL. This directly connects your frontend to the backend.

### 4.3 Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Copy your Vercel frontend URL (e.g., `https://subtrack.vercel.app`)

### 4.4 Update Backend CORS

Go back to Railway and update the `CLIENT_URL` environment variable:
```env
CLIENT_URL=https://subtrack.vercel.app
```

Redeploy the backend if needed.

---

## 🔐 Step 5: Configure Services

### 5.1 Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Add your Vercel frontend URL to **Allowed Origins**
3. Add your Railway backend URL to **Backend API** allowed origins
4. Copy your production keys:
   - `pk_live_...` → Frontend `VITE_CLERK_PUBLISHABLE_KEY`
   - `sk_live_...` → Backend `CLERK_SECRET_KEY`

### 5.2 Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live Mode**
3. Copy your keys:
   - `sk_live_...` → Backend `STRIPE_SECRET_KEY`
4. Set up webhook:
   - Endpoint URL: `https://your-backend.railway.app/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy webhook secret → Backend `STRIPE_WEBHOOK_SECRET`

### 5.3 Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to Backend `GEMINI_API_KEY`

### 5.4 Resend (Optional - Email Reports)

1. Go to [Resend](https://resend.com) and create an account
2. In the dashboard, generate an API key (`RESEND_API_KEY`)
3. (Recommended) Configure a verified domain or use Resend's sandbox domain
4. Set `RESEND_FROM_EMAIL` to the sender (e.g., `"SubTrack <reports@subtrack.app>"`)
5. Add both variables to Railway if you want monthly digest emails

---

## 🔒 Step 6: Security Checklist

- [ ] Use production Clerk keys (not test keys)
- [ ] Use production Stripe keys (not test keys)
- [ ] Generate a secure `ENCRYPTION_KEY` (32+ random characters)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] CORS properly configured in backend
- [ ] All environment variables set in Railway
- [ ] All environment variables set in Vercel
- [ ] `.env` files NOT committed to git (check `.gitignore`)

---

## 🧪 Step 7: Test Production Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend Health Check**: Visit `https://your-backend.railway.app/health`
3. **Test Authentication**: Sign up/login
4. **Test API**: Connect a service and run a scan
5. **Test Payments**: Try the checkout flow (use Stripe test mode first)

---

## 📊 Step 8: Monitoring

### Railway Monitoring
- View logs in Railway dashboard
- Set up alerts for errors
- Monitor resource usage

### Vercel Monitoring
- View build logs
- Monitor analytics
- Set up error tracking (optional)

---

## 🔄 Step 9: Continuous Deployment

Both Vercel and Railway automatically deploy on git push:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Vercel and Railway will auto-deploy
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Railway logs
- Verify all environment variables are set
- Check MongoDB connection string

**Problem**: CORS errors
- Verify `CLIENT_URL` matches your Vercel URL exactly
- Check CORS configuration in `backend/src/index.ts`

### Frontend Issues

**Problem**: API calls failing
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Verify backend is running (check `/health` endpoint)

**Problem**: Build fails
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

---

## 📝 Environment Variables Summary

### Frontend (Vercel)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-backend.railway.app
```

### Backend (Railway)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
CLIENT_URL=https://your-app.vercel.app
ENCRYPTION_KEY=your_secure_key
GEMINI_API_KEY=your_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_... (optional)
```

---

## 🎉 You're Live!

Your SubTrack app should now be running in production!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app
- **API Health**: https://your-backend.railway.app/health

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Clerk Documentation](https://clerk.com/docs)

