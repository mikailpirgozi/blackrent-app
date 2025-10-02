#!/bin/bash

# Safe Development Server - zabráni cache problémom

echo "🧹 Čistím cache pred štartom..."

# Kill existing processes
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clean caches
echo "🗑️  Čistím .next cache..."
rm -rf .next

echo "🗑️  Čistím node_modules cache..."
rm -rf node_modules/.cache

# Validate SVG files
echo "🔍 Validujem SVG súbory..."
node scripts/svg-validator.js

if [ $? -eq 0 ]; then
    echo "✅ SVG validácia úspešná!"
    
    # Build test
    echo "🏗️  Testujem build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build test úspešný!"
        
        # Clean build artifacts before dev
        rm -rf .next
        
        echo "🚀 Spúšťam development server..."
        npm run dev
    else
        echo "❌ Build test zlyhal! Kontrolujte chyby."
        exit 1
    fi
else
    echo "❌ SVG validácia zlyhala! Opravte chyby pred pokračovaním."
    exit 1
fi
