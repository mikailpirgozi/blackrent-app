#!/bin/bash

# 🚀 Inštalácia Auto-Start systému pre BlackRent
# Nastaví automatické spúšťanie aplikácie pri štarte systému

set -e

# Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"

echo -e "${CYAN}🚀 BlackRent Auto-Start Installer${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Vytvorenie LaunchAgent pre macOS
echo -e "${BLUE}📋 1. VYTVORENIE LAUNCHAGENT${NC}"

PLIST_FILE="$HOME/Library/LaunchAgents/com.blackrent.autostart.plist"

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.blackrent.autostart</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$PROJECT_ROOT/scripts/auto-startup.sh</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/logs/autostart.log</string>
    
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/logs/autostart-error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
        <key>NODE_ENV</key>
        <string>development</string>
    </dict>
    
    <key>ThrottleInterval</key>
    <integer>60</integer>
</dict>
</plist>
EOF

echo -e "   └─ ✅ LaunchAgent vytvorený: $PLIST_FILE"

# 2. Načítanie LaunchAgent
echo -e "${BLUE}⚡ 2. AKTIVÁCIA AUTO-START${NC}"

# Unload ak už existuje
launchctl unload "$PLIST_FILE" 2>/dev/null || true

# Load nový
if launchctl load "$PLIST_FILE"; then
    echo -e "   └─ ✅ Auto-start aktivovaný"
else
    echo -e "   └─ ❌ Chyba pri aktivácii auto-start"
    exit 1
fi

# 3. Vytvorenie alias príkazov
echo -e "${BLUE}📝 3. VYTVORENIE ALIAS PRÍKAZOV${NC}"

ALIAS_FILE="$HOME/.blackrent_aliases"

cat > "$ALIAS_FILE" << 'EOF'
# BlackRent Development Aliases
alias br-start='cd "$PROJECT_ROOT" && npm run dev:auto'
alias br-stop='cd "$PROJECT_ROOT" && npm run dev:stop'
alias br-restart='cd "$PROJECT_ROOT" && npm run dev:restart'
alias br-health='cd "$PROJECT_ROOT" && npm run health'
alias br-fix='cd "$PROJECT_ROOT" && npm run fix'
alias br-monitor='cd "$PROJECT_ROOT" && npm run dev:monitor'
alias br-recovery='cd "$PROJECT_ROOT" && npm run dev:recovery'
alias br-maintain='cd "$PROJECT_ROOT" && npm run dev:maintain'
alias br-logs='cd "$PROJECT_ROOT" && tail -f logs/backend.log logs/frontend.log'
alias br-status='cd "$PROJECT_ROOT" && echo "Backend: $(curl -s http://localhost:3001/api/test-simple | grep -o "success.*true" || echo "OFFLINE")" && echo "Frontend: $(curl -s http://localhost:3000 >/dev/null && echo "ONLINE" || echo "OFFLINE")"'
EOF

# Pridanie do shell profile
SHELL_PROFILE=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_PROFILE="$HOME/.bash_profile"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
fi

if [ -n "$SHELL_PROFILE" ]; then
    # Kontrola či už existuje
    if ! grep -q "blackrent_aliases" "$SHELL_PROFILE" 2>/dev/null; then
        echo "" >> "$SHELL_PROFILE"
        echo "# BlackRent Development Aliases" >> "$SHELL_PROFILE"
        echo "source \"$ALIAS_FILE\"" >> "$SHELL_PROFILE"
        echo -e "   └─ ✅ Aliases pridané do $SHELL_PROFILE"
    else
        echo -e "   └─ ✅ Aliases už existujú v $SHELL_PROFILE"
    fi
fi

# 4. Vytvorenie desktop shortcut
echo -e "${BLUE}🖥️  4. VYTVORENIE DESKTOP SHORTCUT${NC}"

DESKTOP_APP="$HOME/Desktop/BlackRent.app"

if [ ! -d "$DESKTOP_APP" ]; then
    mkdir -p "$DESKTOP_APP/Contents/MacOS"
    
    cat > "$DESKTOP_APP/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>BlackRent</string>
    <key>CFBundleIdentifier</key>
    <string>com.blackrent.app</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleExecutable</key>
    <string>blackrent</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF
    
    cat > "$DESKTOP_APP/Contents/MacOS/blackrent" << EOF
#!/bin/bash
cd "$PROJECT_ROOT"
./scripts/auto-startup.sh
open http://localhost:3000
EOF
    
    chmod +x "$DESKTOP_APP/Contents/MacOS/blackrent"
    echo -e "   └─ ✅ Desktop shortcut vytvorený"
else
    echo -e "   └─ ✅ Desktop shortcut už existuje"
fi

echo ""
echo -e "${GREEN}✅ Auto-start systém úspešne nainštalovaný!${NC}"
echo ""
echo -e "${CYAN}📋 Dostupné príkazy:${NC}"
echo -e "  ${YELLOW}npm run dev:auto${NC}     - Automatické spustenie s monitorovaním"
echo -e "  ${YELLOW}npm run dev:monitor${NC}  - Kontinuálne monitorovanie"
echo -e "  ${YELLOW}npm run dev:recovery${NC} - Automatické riešenie problémov"
echo -e "  ${YELLOW}npm run dev:maintain${NC} - Preventívna údržba"
echo ""
echo -e "${CYAN}📋 Alias príkazy (po reštarte terminálu):${NC}"
echo -e "  ${YELLOW}br-start${NC}    - Spustiť aplikáciu"
echo -e "  ${YELLOW}br-stop${NC}     - Zastaviť aplikáciu"
echo -e "  ${YELLOW}br-health${NC}   - Kontrola zdravia"
echo -e "  ${YELLOW}br-status${NC}   - Rýchly status"
echo ""
echo -e "${CYAN}🚀 Aplikácia sa teraz spustí automaticky pri štarte systému!${NC}"
echo -e "${CYAN}🖥️  Desktop shortcut: ~/Desktop/BlackRent.app${NC}"
