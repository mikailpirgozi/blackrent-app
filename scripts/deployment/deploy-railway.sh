#!/bin/bash

echo "🚀 Deploying BlackRent to Railway..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the project root?"
  exit 1
fi

# Build frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed!"
  exit 1
fi

# Check if build directory exists
if [ ! -d "build" ]; then
  echo "❌ Build directory not found!"
  exit 1
fi

echo "✅ Frontend build successful!"

# Add and commit changes
echo "📝 Committing changes..."
git add .
git commit -m "Fix Railway deployment configuration"

# Push to Railway
echo "🚀 Pushing to Railway..."
git push

echo "✅ Deployment complete!"
echo "🌐 Check your Railway dashboard for deployment status"
echo "📊 Health check will be available at: https://your-app.railway.app/health" 