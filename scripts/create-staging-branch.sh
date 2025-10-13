#!/bin/bash

# 🎯 BlackRent Staging Branch Setup
# This script creates and sets up the staging branch for safe testing

set -e

echo "🚀 BlackRent Staging Branch Setup"
echo "================================="

# Check if staging branch exists
if git show-ref --verify --quiet refs/heads/staging; then
  echo "✅ Staging branch already exists"
  git checkout staging
  echo "📦 Pulling latest changes..."
  git pull origin staging || true
else
  echo "🆕 Creating new staging branch from main..."
  git checkout -b staging
  echo "✅ Staging branch created"
fi

# Merge latest main changes
echo ""
echo "🔄 Merging latest main changes..."
git merge main --no-edit || {
  echo "⚠️  Merge conflicts detected. Please resolve manually."
  exit 1
}

# Push staging branch
echo ""
echo "📤 Pushing staging branch to remote..."
git push -u origin staging || {
  echo "ℹ️  Branch already exists on remote, updating..."
  git push origin staging
}

echo ""
echo "✅ Staging branch is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway Dashboard: https://railway.app"
echo "2. Click 'New Service' in your BlackRent project"
echo "3. Connect this GitHub repo, select 'staging' branch"
echo "4. Set environment variables (see docs/deployment/STAGING-SETUP.md)"
echo "5. Deploy! 🚀"
echo ""
echo "💡 To deploy to staging:"
echo "   git checkout staging"
echo "   git merge main  # or make changes directly"
echo "   git push origin staging"
echo ""
echo "💡 To deploy to production:"
echo "   git checkout main"
echo "   git merge staging  # after testing"
echo "   git push origin main"

