@echo off
REM SubTrack - Build and Deploy Script for EC2
REM This script builds the frontend and backend, then prepares for deployment
REM The backend folder becomes a standalone deployment package

echo ========================================
echo SubTrack EC2 Deployment Build Script
echo ========================================
echo.

REM Step 1: Build the frontend
echo [1/4] Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    exit /b 1
)
echo Frontend build complete!
echo.

REM Step 2: Clear old public folder in backend
echo [2/4] Clearing old public folder...
cd ..\backend
if exist public (
    rmdir /s /q public
)
mkdir public
echo Old public folder cleared!
echo.

REM Step 3: Copy frontend dist to backend/public
echo [3/4] Copying frontend build to backend/public...
xcopy /s /e /y ..\frontend\dist\* public\
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to copy frontend files!
    exit /b 1
)
echo Frontend files copied!
echo.

REM Step 4: Build the backend TypeScript
echo [4/4] Building backend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Backend build failed!
    exit /b 1
)
echo Backend build complete!
echo.

echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your backend folder is now ready for deployment!
echo.
echo === DEPLOYMENT OPTIONS ===
echo.
echo OPTION 1: Push to a NEW deployment repo
echo   cd backend
echo   git init
echo   git remote add origin https://github.com/YOUR_USERNAME/subtrack-deploy.git
echo   git add .
echo   git commit -m "Deploy: Initial build"
echo   git branch -M main
echo   git push -u origin main
echo.
echo OPTION 2: Update existing deployment repo
echo   cd backend
echo   git add .
echo   git commit -m "Deploy: Update"
echo   git push
echo.
echo ON EC2:
echo   git pull
echo   npm install --production
echo   npm start
echo.
cd ..
