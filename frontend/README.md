# SubTrack Frontend

React + TypeScript + Vite frontend for SubTrack.

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:5000
```

For production, set these in Vercel dashboard.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy!

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions.
