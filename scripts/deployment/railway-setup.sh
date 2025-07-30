#!/bin/bash

echo "🚀 Setting up BlackRent Railway project..."

# Check if logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway login confirmed"

# Create new project
echo "📝 Creating new Railway project..."
railway init blackrent-app

# Link to project
echo "🔗 Linking to project..."
railway link

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=5001

# Deploy
echo "🚀 Deploying application..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Check your Railway dashboard for the deployment URL" 