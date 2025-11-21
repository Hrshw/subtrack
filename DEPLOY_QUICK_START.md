# 🚀 SubTrack - Quick Deploy Reference

## Step-by-Step Deployment

### 1️⃣ Install Vercel CLI (if not already done)
```bash
npm install -g vercel
```

### 2️⃣ Deploy Backend
```bash
cd backend
vercel login
vercel --prod
```
**Save the backend URL!** (e.g., `https://subtrack-backend.vercel.app`)

### 3️⃣ Deploy Frontend
```bash
cd ../frontend
vercel --prod
```
**Save the frontend URL!** (e.g., `https://subtrack.vercel.app`)

### 4️⃣ Configure Environment Variables

**Backend (via Vercel Dashboard):**
- `MONGO_URI` - Your MongoDB connection string
- `CLERK_SECRET_KEY` - From Clerk
- `JWT_SECRET` - Random secure string
- `CLIENT_URL` - Your frontend URL from step 3
- `RESEND_API_KEY` - For email notifications
- `RESEND_FROM_EMAIL` - Your verified email domain

**Frontend (via Vercel Dashboard):**
- `VITE_API_URL` - Your backend URL from step 2 + `/api`
- `VITE_CLERK_PUBLISHABLE_KEY` - From Clerk

### 5️⃣ Redeploy After Adding Variables
```bash
# In backend directory
vercel --prod

# In frontend directory  
vercel --prod
```

---

## 🔗 Important URLs

After deployment, you'll have:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-api.vercel.app`
- **Docs:** `https://your-app.vercel.app/docs`

---

## ✅ Quick Test

1. Visit your frontend URL
2. Click "Sign Up"
3. Create an account
4. Connect a service
5. Run a scan

If everything works, you're live! 🎉

---

## 🆘 Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
