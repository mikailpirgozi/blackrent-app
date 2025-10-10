#!/bin/bash
echo "🔒 REMOVING API KEY FROM CODE"
echo "=============================="
echo ""

# 1. Nájsť a nahradiť API kľúč v súbore
file="apps/mobile/BLACKRENT_WORLD_CLASS_IMPLEMENTATION_PLAN.md"

if [ -f "$file" ]; then
    echo "📝 Opravujem súbor: $file"
    
    # Nahradiť API kľúč zástupným textom
    sed -i '' 's/sk-proj-[a-zA-Z0-9_-]*/YOUR_OPENAI_API_KEY_HERE/g' "$file"
    
    echo "✅ API kľúč odstránený"
    echo ""
    
    # Commitnúť opravu
    git add "$file"
    git commit --amend --no-edit
    
    echo "✅ Commit aktualizovaný"
else
    echo "❌ Súbor nenájdený: $file"
fi

echo ""
echo "🔒 API kľúč bezpečne odstránený!"
