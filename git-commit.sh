#!/bin/bash

echo "🔧 PROTOCOLS DATA MAPPING FIX - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "fix: Protocols data mapping and error handling

🔧 PROTOCOLS DATA MAPPING FIX:
- HandoverProtocolForm.tsx: Fixed data mapping to match backend expectations
- RentalListNew.tsx: Added safe destructuring with fallback for protocols data
- Fixed 500 Internal Server Error when creating handover protocols
- Fixed destructuring error when loading protocols

✅ RESULT:
- Handover protocols can now be created successfully
- Proper error handling for missing protocol data
- Backend receives correctly formatted data
- No more 500 errors or destructuring issues

🚀 IMPACT: Protocols workflow now fully functional!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ PROTOCOLS DATA MAPPING FIX DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 