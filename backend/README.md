# SubTrack Backend

Express + TypeScript backend for SubTrack.

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/subtrack
CLERK_SECRET_KEY=sk_test_your_key_here
CLIENT_URL=http://localhost:5173
# optional: add comma-separated preview domains
# CLIENT_URLS=https://preview-1.vercel.app,https://preview-2.vercel.app
ENCRYPTION_KEY=your_32_character_key_here
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
OPENROUTER_REFERRER=https://your-app.vercel.app (optional)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_resend_api_key (optional)
RESEND_FROM_EMAIL="SubTrack <reports@yourdomain.com>" (optional)
```

For production, set these in Railway dashboard.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Deploy to Railway

1. Push to GitHub
2. Create new project in Railway
3. Connect GitHub repo
4. Set root directory to `backend`
5. Set environment variables
6. Deploy!

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions.

