@echo off
echo Adding Backend Environment Variables to Vercel...
echo.

cd backend

echo Adding CLERK_SECRET_KEY...
echo sk_test_Qaz2AISZ1RncoNb2PM66sMK5zPftEccIs9JRkBkV43 | vercel env add CLERK_SECRET_KEY production

echo Adding ENCRYPTION_KEY...
echo my_super_secret_encryption_key_32_chars_long | vercel env add ENCRYPTION_KEY production

echo Adding STRIPE_SECRET_KEY...
echo sk_test_placeholder | vercel env add STRIPE_SECRET_KEY production

echo Adding STRIPE_WEBHOOK_SECRET...
echo whsec_placeholder | vercel env add STRIPE_WEBHOOK_SECRET production

echo Adding RESEND_API_KEY...
echo re_LMn6MQUM_7PLXHyYXHxJPMeWqAhib4tJL | vercel env add RESEND_API_KEY production

echo Adding CLIENT_URL...
echo https://frontend-4w3olav5c-hrshws-projects.vercel.app | vercel env add CLIENT_URL production

echo Adding GEMINI_API_KEY...
echo AIzaSyB4Y4vXSeT2O-knhJ5POWf65aWW0gF0CFI | vercel env add GEMINI_API_KEY production

echo Adding VERCEL_CLIENT_ID...
echo oac_nxHRlqsRINncldfqrV8NfUX7 | vercel env add VERCEL_CLIENT_ID production

echo Adding VERCEL_CLIENT_SECRET...
echo wKWpYLjyqUfdgPqP8cunJsXY | vercel env add VERCEL_CLIENT_SECRET production

echo Adding NODE_ENV...
echo production | vercel env add NODE_ENV production

echo Adding JWT_SECRET...
echo my_super_secret_jwt_key_for_subtrack_2025 | vercel env add JWT_SECRET production

echo.
echo ✅ All backend environment variables added!
echo.

cd ..

echo Adding Frontend Environment Variables to Vercel...
echo.

cd frontend

echo Adding VITE_CLERK_PUBLISHABLE_KEY...
echo pk_test_aGFwcHktZnJvZy04NS5jbGVyay5hY2NvdW50cy5kZXYk | vercel env add VITE_CLERK_PUBLISHABLE_KEY production

echo Adding VITE_API_URL...
echo https://backend-109g2phbb-hrshws-projects.vercel.app/api | vercel env add VITE_API_URL production

echo.
echo ✅ All frontend environment variables added!
echo.
echo 🎉 Done! Now redeploying both projects...
echo.

cd ..\backend
vercel --prod --yes

cd ..\frontend
vercel --prod --yes

echo.
echo 🚀 Deployment complete!
