#!/bin/bash

echo "🔄 Blackrent - Test API"
echo "======================"

# Čakáme na backend
echo "⏳ Čakáme na backend..."
sleep 5

# Test health
echo "🏥 Health check:"
curl -s http://localhost:5001/health || echo "❌ Backend nebeží"
echo ""

# Test prihlásenie admin
echo "🔑 Test prihlásenia admin:"
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}' http://localhost:5001/api/auth/login)
echo "$response"
echo ""

# Test vozidlá
echo "🚗 Test vozidiel:"
curl -s http://localhost:5001/api/vehicles | jq . || echo "❌ Chyba pri načítaní vozidiel"
echo ""

echo "✅ Test dokončený" 