# 🚀 Automated Deployment Script for SubTrack Monorepo

## Prerequisites
✅ Vercel CLI installed
✅ Logged into Vercel
✅ GitHub repo: https://github.com/Hrshw/subtrack.git

---

## 📦 Deployment Strategy (Free Plan)

Since you're on the free Vercel plan with a monorepo, we'll deploy:
1. **Backend** as one Vercel project (from `/backend` directory)
2. **Frontend** as another Vercel project (from `/frontend` directory)

---

## 🔧 Step 1: Deploy Backend API

### 1.1 Navigate to backend
```bash
cd backend
```

### 1.2 Deploy to Vercel
```bash
vercel --prod
```

**During deployment, answer:**
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- What's your project's name? **subtrack-api** (or your preferred name)
- In which directory is your code located? **./** (current directory)
- Want to override settings? **N**

### 1.3 Save Your Backend URL
After deployment completes, you'll see:
```
✅ Production: https://subtrack-api.vercel.app
```
**SAVE THIS URL!** You'll need it for the frontend.

---

## 🎨 Step 2: Deploy Frontend

### 2.1 Navigate to frontend
```bash
cd ../frontend
```

### 2.2 Deploy to Vercel
```bash
vercel --prod
```

**During deployment, answer:**
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N**
- What's your project's name? **subtrack** (or your preferred name)
- In which directory is your code located? **./** (current directory)
- Want to override settings? **N**

### 2.3 Save Your Frontend URL
After deployment completes, you'll see:
```
✅ Production: https://subtrack.vercel.app
```

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Backend Environment Variables

Go to: https://vercel.com/dashboard → Your backend project → Settings → Environment Variables

Add these variables for **Production**:

**Required:**
```
MONGO_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_SECRET=your_random_secret_string
CLIENT_URL=https://subtrack.vercel.app (your frontend URL from Step 2.3)
NODE_ENV=production
```

**Optional (for full features):**
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
STRIPE_SECRET_KEY=your_stripe_key
```

### 3.2 Frontend Environment Variables

Go to: https://vercel.com/dashboard → Your frontend project → Settings → Environment Variables

Add these variables for **Production**:
```
VITE_API_URL=https://subtrack-api.vercel.app/api (your backend URL from Step 1.3 + /api)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 🔄 Step 4: Redeploy After Adding Variables

### 4.1 Redeploy Backend
```bash
cd backend
vercel --prod
```

### 4.2 Redeploy Frontend
```bash
cd ../frontend
vercel --prod
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend Health
Visit: `https://subtrack-api.vercel.app/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-21T...",
  "environment": "production"
}
```

### 5.2 Test Frontend
Visit: `https://subtrack.vercel.app`

Should load the landing page with the SubTrack logo.

### 5.3 Test Full Flow
1. Click "Sign Up"
2. Create an account
3. Try connecting a service
4. Run a scan

---

## 🎯 Quick Commands Reference

**Deploy Backend:**
```bash
cd backend && vercel --prod
```

**Deploy Frontend:**
```bash
cd frontend && vercel --prod
```

**View Logs:**
```bash
vercel logs <deployment-url>
```

**List Deployments:**
```bash
vercel ls
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module"
**Solution:** Make sure all dependencies are in `package.json` and run:
```bash
npm install
vercel --prod
```

### Issue: CORS errors
**Solution:** 
1. Check `CLIENT_URL` in backend matches your frontend URL exactly
2. Make sure both use `https://`
3. Redeploy backend after updating

### Issue: Database connection failed
**Solution:**
1. Verify `MONGO_URI` is correct
2. In MongoDB Atlas, add `0.0.0.0/0` to IP whitelist
3. Redeploy backend

### Issue: Build fails
**Solution:**
1. Test build locally: `npm run build`
2. Check TypeScript errors: `npx tsc -b`
3. Verify all imports are correct

---

## 🚀 Alternative: GitHub Integration (Recommended)

For automatic deployments on every push:

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import in Vercel Dashboard
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `Hrshw/subtrack`
4. Create **TWO separate projects**:
   - **Project 1 (Backend):** Root Directory = `backend`
   - **Project 2 (Frontend):** Root Directory = `frontend`

### 3. Configure Each Project
Set the environment variables as described in Step 3

### 4. Deploy
Vercel will automatically deploy both projects!

---

## 📊 Post-Deployment Checklist

- [ ] Backend health endpoint returns 200
- [ ] Frontend loads correctly
- [ ] User signup works
- [ ] Database connection works
- [ ] Clerk authentication works
- [ ] Email notifications work (if RESEND_API_KEY is set)
- [ ] Custom domain configured (optional)

---

## 🎉 You're Live!

Your SubTrack app is now deployed and accessible worldwide!

**Share your app:**
- Frontend: `https://subtrack.vercel.app`
- Docs: `https://subtrack.vercel.app/docs`
- API: `https://subtrack-api.vercel.app`

**Next steps:**
1. Test all features thoroughly
2. Share with beta users
3. Monitor the waitlist
4. Prepare for Pro launch! 🚀
