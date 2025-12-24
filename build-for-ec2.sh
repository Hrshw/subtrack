#!/bin/bash
# SubTrack - Build and Deploy Script for EC2
# This script builds the frontend and copies it to the backend/public folder
# After running this, push the backend to GitHub and pull on EC2

echo "========================================"
echo "SubTrack EC2 Deployment Build Script"
echo "========================================"
echo ""

# Step 1: Build the frontend
echo "[1/4] Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi
echo "Frontend build complete!"
echo ""

# Step 2: Clear old public folder in backend
echo "[2/4] Clearing old public folder..."
cd ../backend
rm -rf public
mkdir -p public
echo "Old public folder cleared!"
echo ""

# Step 3: Copy frontend dist to backend/public
echo "[3/4] Copying frontend build to backend/public..."
cp -r ../frontend/dist/* public/
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to copy frontend files!"
    exit 1
fi
echo "Frontend files copied!"
echo ""

# Step 4: Build the backend TypeScript
echo "[4/4] Building backend..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Backend build failed!"
    exit 1
fi
echo "Backend build complete!"
echo ""

echo "========================================"
echo "BUILD SUCCESSFUL!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. cd backend"
echo "  2. git add ."
echo "  3. git commit -m 'Deploy: Built for EC2'"
echo "  4. git push"
echo "  5. On EC2: git pull && npm install && npm start"
echo ""
cd ..
