#!/bin/bash

# BlackRent Customer Website - Simple Health Check
# Rýchla diagnostika bez zložitých príkazov

echo "🚀 BlackRent Customer Website - Health Check"
echo "============================================="

# Základné kontroly
echo "📁 Súbory:"
[ -f "package.json" ] && echo "✅ package.json" || echo "❌ package.json"
[ -f "next.config.js" ] && echo "✅ next.config.js" || echo "❌ next.config.js"
[ -d "src" ] && echo "✅ src/" || echo "❌ src/"
[ -d "public" ] && echo "✅ public/" || echo "❌ public/"
[ -d "node_modules" ] && echo "✅ node_modules/" || echo "❌ node_modules/"

echo ""
echo "🖼️  Assets:"
[ -d "public/figma-assets" ] && echo "✅ figma-assets/" || echo "❌ figma-assets/"
[ -f "public/figma-assets/union-18.svg" ] && echo "✅ union-18.svg" || echo "❌ union-18.svg"
[ -f "public/figma-assets/icon-24-px-filled-120.svg" ] && echo "✅ icon-24-px-filled-120.svg" || echo "❌ icon-24-px-filled-120.svg"
[ -f "public/figma-assets/icon-24-px-132.svg" ] && echo "✅ icon-24-px-132.svg" || echo "❌ icon-24-px-132.svg"

echo ""
echo "🌐 Server:"
if lsof -i:3002 >/dev/null 2>&1; then
    echo "✅ Port 3002 obsadený"
    
    if command -v curl >/dev/null 2>&1; then
        http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null || echo "000")
        if [ "$http_status" = "200" ]; then
            echo "✅ HTTP odpoveď: $http_status"
        else
            echo "❌ HTTP odpoveď: $http_status"
        fi
    else
        echo "⚠️  curl nedostupný"
    fi
else
    echo "❌ Port 3002 voľný (server nebeží)"
fi

echo ""
echo "🏗️  Build:"
if [ -d ".next" ]; then
    echo "✅ .next/ existuje"
else
    echo "⚠️  .next/ neexistuje"
fi

echo ""
echo "📊 Zhrnutie:"
echo "Server je dostupný na: http://localhost:3002"
echo "Pre monitoring použite: npm run server-status"
echo "Pre reštart použite: npm run server-restart"

echo ""
