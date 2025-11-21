# Environment Variables Reference

## Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts with `pk_`) | `pk_live_...` |
| `VITE_API_URL` | **REQUIRED** - Backend API URL (your Railway backend URL) | `https://subtrack-delta.railway.app` |

**Important**: Set `VITE_API_URL` to your Railway backend URL in Vercel environment variables. This directly connects to your backend and avoids CORS issues when properly configured.

## Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets this automatically) | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) | `sk_live_...` |
| `CLIENT_URL` | Primary frontend URL for CORS | `https://subtrack.vercel.app` |
| `CLIENT_URLS` | (Optional) Comma-separated extra origins (preview URLs) | `https://preview-1.vercel.app,https://preview-2.vercel.app` |
| `ENCRYPTION_KEY` | 32+ character encryption key | Generate random string |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_`) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (starts with `whsec_`) | `whsec_...` |
| `RESEND_API_KEY` | Resend API key (optional) | `re_...` |
| `RESEND_FROM_EMAIL` | Email sender (name + address) | `"SubTrack <reports@subtrack.app>"` |

## Generating Encryption Key

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Important Notes

1. **Never commit `.env` files to git**
2. **Use production keys in production** (not test keys)
3. **Keep keys secure** - rotate them if compromised
4. **Update CORS** when changing `CLIENT_URL`

