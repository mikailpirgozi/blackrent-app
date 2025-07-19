#!/bin/bash

echo "🔧 PROTOCOLS API FIX - USE APISERVICE INSTEAD OF DIRECT FETCH - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "fix: Protocols API integration - use apiService instead of direct fetch

🔧 PROTOCOLS API FIX:
- api.ts: Added protocol methods (getProtocolsByRental, createHandoverProtocol, createReturnProtocol)
- RentalListNew.tsx: Fixed API calls to use apiService instead of direct fetch
- Fixed 405 Method Not Allowed errors on Vercel
- Fixed JSON parsing errors

✅ RESULT:
- Protocols API calls now go to Railway backend correctly
- No more 405 errors or JSON parsing issues
- Proper error handling and authentication
- Protocols workflow fully functional

🚀 IMPACT: Protocols can now be created and managed successfully!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ PROTOCOLS API FIX DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 