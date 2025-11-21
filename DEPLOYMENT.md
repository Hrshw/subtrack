# Deployment Guide - SubTrack

This guide will help you deploy SubTrack to production. You can use any hosting platform of your choice.

---

## 📋 Prerequisites

1. **GitHub Account** (for version control)
2. **Frontend Hosting** (any static hosting service)
3. **Backend Hosting** (any Node.js hosting service)
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
4. Whitelist IP addresses (use `0.0.0.0/0` for cloud hosting)
5. Get your connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/subtrack?retryWrites=true&w=majority
   ```

---

## ⚙️ Step 3: Deploy Backend

### 3.1 Choose a Hosting Platform

Deploy the `backend` folder to any Node.js hosting service. Examples:
- Render
- Fly.io
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service

### 3.2 Configure Environment Variables

Set the following environment variables in your hosting platform:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/subtrack?retryWrites=true&w=majority

# Clerk
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# Client URL (will be set after frontend deployment)
CLIENT_URL=https://your-frontend-domain.com
# Optional: comma-separated extra origins for preview deployments
# CLIENT_URLS=https://preview-1.example.com,https://preview-2.example.com

# Encryption Key (generate a secure 32+ character string)
ENCRYPTION_KEY=your_secure_random_32_character_key_here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Resend (Optional)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="SubTrack <reports@subtrack.app>"
```

### 3.3 Build and Deploy

Your hosting platform should:
1. Run `npm install` in the `backend` directory
2. Run `npm run build` to compile TypeScript
3. Run `npm start` to start the server

### 3.4 Get Backend URL

After deployment, copy your backend URL (e.g., `https://api.example.com`)

---

## 🎨 Step 4: Deploy Frontend

### 4.1 Choose a Hosting Platform

Deploy the `frontend` folder to any static hosting service. Examples:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

### 4.2 Configure Environment Variables

Set the following environment variables in your hosting platform:

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key

# API URL (REQUIRED - your backend URL from Step 3.4)
VITE_API_URL=https://api.example.com
```

**Important**: Replace `https://api.example.com` with your actual backend URL.

### 4.3 Build and Deploy

Your hosting platform should:
1. Run `npm install` in the `frontend` directory
2. Run `npm run build` to build the production bundle
3. Serve the `dist` folder

### 4.4 Get Frontend URL

After deployment, copy your frontend URL (e.g., `https://app.example.com`)

### 4.5 Update Backend CORS

Go back to your backend hosting platform and update the `CLIENT_URL` environment variable:
```env
CLIENT_URL=https://app.example.com
```

Redeploy the backend if needed.

---

## 🔐 Step 5: Configure Services

### 5.1 Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Add your frontend URL to **Allowed Origins**
3. Add your backend URL to **Backend API** allowed origins
4. Copy your production keys:
   - `pk_live_...` → Frontend `VITE_CLERK_PUBLISHABLE_KEY`
   - `sk_live_...` → Backend `CLERK_SECRET_KEY`

### 5.2 Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live Mode**
3. Copy your keys:
   - `sk_live_...` → Backend `STRIPE_SECRET_KEY`
4. Set up webhook:
   - Endpoint URL: `https://your-backend-domain.com/api/stripe/webhook`
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
5. Add both variables to your backend hosting platform if you want monthly digest emails

---

## 🔒 Step 6: Security Checklist

- [ ] Use production Clerk keys (not test keys)
- [ ] Use production Stripe keys (not test keys)
- [ ] Generate a secure `ENCRYPTION_KEY` (32+ random characters)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] CORS properly configured in backend
- [ ] All environment variables set in backend hosting
- [ ] All environment variables set in frontend hosting
- [ ] `.env` files NOT committed to git (check `.gitignore`)

---

## 🧪 Step 7: Test Production Deployment

1. **Frontend**: Visit your frontend URL
2. **Backend Health Check**: Visit `https://your-backend-domain.com/health`
3. **Test Authentication**: Sign up/login
4. **Test API**: Connect a service and run a scan
5. **Test Payments**: Try the checkout flow (use Stripe test mode first)

---

## 📊 Step 8: Monitoring

- View logs in your hosting platform dashboard
- Set up alerts for errors
- Monitor resource usage
- Set up error tracking (optional)

---

## 🔄 Step 9: Continuous Deployment

Configure your hosting platforms to automatically deploy on git push:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Your hosting platforms should auto-deploy
```

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check hosting platform logs
- Verify all environment variables are set
- Check MongoDB connection string

**Problem**: CORS errors
- Verify `CLIENT_URL` matches your frontend URL exactly
- Check CORS configuration in `backend/src/index.ts`

### Frontend Issues

**Problem**: API calls failing
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Verify backend is running (check `/health` endpoint)

**Problem**: Build fails
- Check hosting platform build logs
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

---

## 📝 Environment Variables Summary

### Frontend
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-backend-domain.com
```

### Backend
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_live_...
CLIENT_URL=https://your-frontend-domain.com
ENCRYPTION_KEY=your_secure_key
GEMINI_API_KEY=your_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_... (optional)
RESEND_FROM_EMAIL="SubTrack <reports@subtrack.app>" (optional)
```

---

## 🎉 You're Live!

Your SubTrack app should now be running in production!

- **Frontend**: https://your-frontend-domain.com
- **Backend**: https://your-backend-domain.com
- **API Health**: https://your-backend-domain.com/health

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
