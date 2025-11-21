# 🚀 Deploying SubTrack to Vercel

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Create a Vercel account at https://vercel.com
3. Have your environment variables ready

---

## 📦 Part 1: Deploy Backend API

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. Set Environment Variables
After deployment, go to your Vercel dashboard and add these environment variables:

**Required:**
- `MONGO_URI` - Your MongoDB connection string
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `JWT_SECRET` - Random secure string
- `CLIENT_URL` - Your frontend URL (will be from next step)

**Optional (for full functionality):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `VERCEL_CLIENT_ID`
- `VERCEL_CLIENT_SECRET`
- `SENTRY_DSN`
- `LINEAR_API_KEY`
- `RESEND_API_KEY`
- `CLERK_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_FROM_EMAIL`

**To set environment variables:**
```bash
vercel env add MONGO_URI
vercel env add CLERK_SECRET_KEY
vercel env add JWT_SECRET
# ... add all others
```

Or use the Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development

### 5. Note Your Backend URL
After deployment, Vercel will give you a URL like:
`https://your-backend-name.vercel.app`

**Save this URL - you'll need it for the frontend!**

---

## 🎨 Part 2: Deploy Frontend

### 1. Navigate to frontend directory
```bash
cd ../frontend
```

### 2. Update Environment Variables
Create/update `.env.production`:
```env
VITE_API_URL=https://your-backend-name.vercel.app/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. Set Environment Variables in Vercel Dashboard
Go to your frontend project settings and add:
- `VITE_API_URL` - Your backend URL from Part 1
- `VITE_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard

### 5. Note Your Frontend URL
Vercel will give you a URL like:
`https://your-app-name.vercel.app`

---

## 🔄 Part 3: Update Backend with Frontend URL

### 1. Go back to backend Vercel project settings
Add/update the `CLIENT_URL` environment variable:
```
CLIENT_URL=https://your-app-name.vercel.app
```

### 2. Redeploy backend
```bash
cd backend
vercel --prod
```

---

## ✅ Part 4: Verify Deployment

### 1. Test Backend
Visit: `https://your-backend-name.vercel.app/health`
Should return: `{"status":"ok",...}`

### 2. Test Frontend
Visit: `https://your-app-name.vercel.app`
Should load the landing page

### 3. Test Full Flow
1. Sign up for an account
2. Connect a service
3. Run a scan
4. Check if data persists

---

## 🎯 Quick Deploy Commands

**Backend:**
```bash
cd backend
vercel --prod
```

**Frontend:**
```bash
cd frontend
vercel --prod
```

---

## 🔧 Troubleshooting

### CORS Errors
- Make sure `CLIENT_URL` in backend matches your frontend URL exactly
- Check that both URLs are using `https://`

### Database Connection Issues
- Verify `MONGO_URI` is correct
- Make sure MongoDB allows connections from Vercel IPs (0.0.0.0/0)

### Build Failures
**Backend:**
- Check that all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npx tsc -b`

**Frontend:**
- Run `npm run build` locally to test
- Check for any TypeScript errors

### Environment Variables Not Working
- Make sure you've set them for "Production" environment
- Redeploy after adding new variables

---

## 🚀 Custom Domain (Optional)

### 1. Add Domain in Vercel Dashboard
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain (e.g., `subtrack.app`)

### 2. Update DNS Records
Add the records Vercel provides to your domain registrar

### 3. Update Environment Variables
Update `CLIENT_URL` in backend to use your custom domain

---

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution times
- Check error rates

### Recommended Setup
1. Enable Vercel Analytics
2. Set up error tracking (Sentry integration)
3. Monitor MongoDB Atlas metrics

---

## 🔄 Continuous Deployment

### Connect to GitHub (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will auto-deploy on every push to `main`

**Setup:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/subtrack.git
git push -u origin main
```

Then in Vercel:
1. Click "Import Project"
2. Select your GitHub repository
3. Configure environment variables
4. Deploy!

---

## 💡 Pro Tips

1. **Separate Projects:** Deploy frontend and backend as separate Vercel projects for better organization
2. **Environment Variables:** Use Vercel's environment variable groups for easier management
3. **Preview Deployments:** Every git branch gets a preview URL automatically
4. **Logs:** Use `vercel logs` to debug production issues
5. **Rollback:** Use Vercel dashboard to instantly rollback to previous deployments

---

## 🎉 You're Live!

Your SubTrack application is now deployed and accessible worldwide!

**Next Steps:**
1. Share your app URL with beta users
2. Monitor the waitlist signups
3. Prepare for Pro launch! 🚀
