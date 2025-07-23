#!/bin/bash

echo "🧪 SPÚŠŤAM AUTOMATICKÝ PUPPETEER TEST"
echo "======================================"

# Nastavenie environment variables
export PDF_GENERATOR_TYPE=puppeteer
export NODE_ENV=development

# Spustenie testu
node run-puppeteer-test.js

echo ""
echo "✅ Test dokončený!" 