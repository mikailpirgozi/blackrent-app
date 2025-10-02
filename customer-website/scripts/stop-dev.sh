#!/bin/bash

# BlackRent Customer Website - Stop Dev Server Script
echo "🛑 Stopping BlackRent Customer Website dev server..."

# Kill processes on port 3002
echo "🔄 Killing processes on port 3002..."
lsof -ti :3002 | xargs kill -9 2>/dev/null || true

# Kill Next.js dev processes
echo "🔄 Killing Next.js dev processes..."
pkill -f "next-dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

echo "✅ Dev server stopped successfully!"
