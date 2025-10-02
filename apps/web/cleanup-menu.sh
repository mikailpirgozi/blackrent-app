#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║       🧹 GIT CLEANUP MENU - BlackRent Project       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "📊 AKTUÁLNY STAV:"
echo "  Lokálnych branchov: $(git branch | wc -l | tr -d ' ')"
echo "  Remote branchov: $(git branch -r | wc -l | tr -d ' ')"
echo "  Aktuálny branch: $(git branch --show-current)"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Čo chceš urobiť?"
echo ""
echo "1) 🔍 Ukázať všetky branche (lokálne + remote)"
echo "2) 🗑️  Vyčistiť LOKÁLNE branche (bezpečné)"
echo "3) 🌐 Vyčistiť REMOTE branche na GitHube (nebezpečné!)"
echo "4) 🧹 Vyčistiť VŠETKO (lokálne + remote)"
echo "5) 📋 Ukázať len dôležité branche"
echo "6) 💾 Backup aktuálnej práce + push na GitHub"
echo "7) ❌ Zrušiť"
echo ""
read -p "Vyber možnosť (1-7): " choice

case $choice in
    1)
        echo ""
        echo "📋 LOKÁLNE BRANCHE:"
        git branch
        echo ""
        echo "🌐 REMOTE BRANCHE:"
        git branch -r
        ;;
    2)
        echo ""
        echo "🗑️ Čistenie lokálnych branchov..."
        ./cleanup-git.sh
        ;;
    3)
        echo ""
        echo "⚠️ POZOR: Toto vymaže branche na GitHube!"
        ./cleanup-git-remote.sh
        ;;
    4)
        echo ""
        echo "🧹 Čistenie VŠETKÉHO..."
        ./cleanup-git.sh
        echo ""
        ./cleanup-git-remote.sh
        ;;
    5)
        echo ""
        echo "✅ DÔLEŽITÉ BRANCHE:"
        echo ""
        echo "📍 Lokálne:"
        git branch | grep -E '(main|shadcn-clean)'
        echo ""
        echo "🌐 Remote:"
        git branch -r | grep -E '(origin/main|origin/desings-customer-website)'
        ;;
    6)
        echo ""
        echo "💾 Backup a push..."
        echo ""
        current_branch=$(git branch --show-current)
        echo "Aktuálny branch: $current_branch"
        echo ""
        
        # Stash changes
        git stash push -m "Backup $(date)"
        
        # Commit všetko
        git add -A
        git commit -m "💾 Backup: Complete shadcn migration ($(date +%Y-%m-%d))" || echo "Žiadne zmeny na commit"
        
        # Push
        echo ""
        echo "Pushnúť na GitHub? (y/n)"
        read -r push_response
        if [[ "$push_response" == "y" ]]; then
            git push origin $current_branch || git push -u origin $current_branch
            echo "✅ Pushnuté na GitHub!"
        else
            echo "❌ Push zrušený"
        fi
        
        # Pop stash
        git stash pop 2>/dev/null || true
        ;;
    7)
        echo ""
        echo "❌ Zrušené"
        ;;
    *)
        echo ""
        echo "❌ Neplatná voľba!"
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════"
echo "Hotovo! 🎉"
