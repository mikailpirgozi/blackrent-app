#!/bin/bash

# BlackRent Customer Website - Stable Dev Server Start Script
echo "🚀 Starting BlackRent Customer Website..."

# Kill any existing processes on port 3002
echo "🔄 Cleaning up existing processes..."
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
pkill -f "next-dev" 2>/dev/null || true
sleep 2

# Clean Next.js cache
echo "🧹 Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache 2>/dev/null || true

# Start dev server
echo "▶️  Starting dev server on http://localhost:3002"
npm run dev
