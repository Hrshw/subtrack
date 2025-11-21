# Environment Variables Reference

## Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts with `pk_`) | `pk_live_...` |
| `VITE_API_URL` | **REQUIRED** - Backend API URL | `http://localhost:5000` or `https://api.example.com` |

**Important**: Set `VITE_API_URL` to your backend API URL. This should point to your deployed backend server.

## Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) | `sk_live_...` |
| `CLIENT_URL` | Primary frontend URL for CORS | `http://localhost:5173` or `https://app.example.com` |
| `CLIENT_URLS` | (Optional) Comma-separated extra origins | `https://preview.example.com,https://staging.example.com` |
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

