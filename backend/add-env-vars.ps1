# Add Missing Environment Variables to Vercel Backend
# Run this script from the backend folder

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adding Missing Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get production backend URL from user
Write-Host "What is your production BACKEND URL?" -ForegroundColor Yellow
Write-Host "Example: https://backend-7fv6ht9ma-hrshws-projects.vercel.app" -ForegroundColor Gray
$BACKEND_URL = Read-Host "Enter URL"

Write-Host ""
Write-Host "What is your production FRONTEND URL?" -ForegroundColor Yellow
Write-Host "Example: https://sub-track.vercel.app" -ForegroundColor Gray
$FRONTEND_URL = Read-Host "Enter URL"

Write-Host ""
Write-Host "Adding environment variables..." -ForegroundColor Green

# OAuth Redirect URIs
Write-Host "Setting GITHUB_REDIRECT_URI..." -ForegroundColor White
$env:VALUE = "$BACKEND_URL/api/oauth/callback/github"
vercel env add GITHUB_REDIRECT_URI production

Write-Host "Setting VERCEL_REDIRECT_URI..." -ForegroundColor White
$env:VALUE = "$BACKEND_URL/api/oauth/callback/vercel"
vercel env add VERCEL_REDIRECT_URI production

Write-Host "Setting LINEAR_REDIRECT_URI..." -ForegroundColor White
$env:VALUE = "$BACKEND_URL/api/oauth/callback/linear"
vercel env add LINEAR_REDIRECT_URI production

# Frontend URL
Write-Host "Setting CLIENT_URL..." -ForegroundColor White
$env:VALUE = $FRONTEND_URL
vercel env add CLIENT_URL production

# OAuth Credentials
Write-Host "Setting GitHub OAuth..." -ForegroundColor White
vercel env add GITHUB_CLIENT_ID production
vercel env add GITHUB_CLIENT_SECRET production

Write-Host "Setting Vercel OAuth..." -ForegroundColor White
vercel env add VERCEL_CLIENT_ID production
vercel env add VERCEL_CLIENT_SECRET production

Write-Host "Setting Linear OAuth..." -ForegroundColor White
vercel env add LINEAR_CLIENT_ID production
vercel env add LINEAR_CLIENT_SECRET production

# Core variables
Write-Host "Setting core variables..." -ForegroundColor White
vercel env add ENCRYPTION_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add CLERK_PUBLISHABLE_KEY production
vercel env add GEMINI_API_KEY production
vercel env add GROQ_API_KEY production
vercel env add OPENROUTER_API_KEY production

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Done! Now REDEPLOY your backend:" -ForegroundColor Green
Write-Host "  vercel --prod" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
