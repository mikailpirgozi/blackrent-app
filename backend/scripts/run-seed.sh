#!/bin/bash

# Run Auth System Seed Script
# This script creates initial users for the new auth system

echo "🌱 Running Auth System Seed..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the seed script
npx ts-node scripts/seed-auth-system.ts

echo ""
echo "✅ Seed script completed!"

