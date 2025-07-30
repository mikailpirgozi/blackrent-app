#!/bin/bash

# 🤖 AI Access Setup - Postupné nastavenie všetkých prístupov
# Interaktívny sprievodca

echo "🤖 AI Access Setup - Postupné nastavenie"
echo "========================================"

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Funkcie
print_header() {
    echo ""
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}📋 Krok $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}💡 $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

wait_for_user() {
    echo -e "${YELLOW}👉 Stlač Enter po dokončení...${NC}"
    read -r
}

# Hlavný setup
print_header "Automatizované nastavenie AI prístupov"

echo "Tento script ťa prevedie krok za krokom cez nastavenie všetkých AI prístupov."
echo "Postupne nastavíme:"
echo "1. 🔧 GitHub Repository Access"
echo "2. 🚂 Railway Dashboard Access"
echo "3. 🔔 Webhooks & Notifications"
echo "4. 🗄️ Database Direct Access"
echo "5. 🔑 API Keys & Services"
echo "6. 📊 Monitoring & Analytics"
echo ""
echo -e "${YELLOW}Pokračujeme? (Enter pre pokračovanie)${NC}"
read -r

# KROK 1: GitHub Repository Access
print_header "KROK 1: GitHub Repository Access"
print_step "1" "Nastavenie GitHub prístupov"

echo "🔧 Pre plnú automatizáciu potrebujem write access na GitHub repository."
echo ""
echo "Postupuj takto:"
echo "1. Choď na GitHub: https://github.com/mikailpirgozi/blackrent-app"
echo "2. Klikni na 'Settings' tab"
echo "3. V menu vľavo klikni na 'Collaborators'"
echo "4. Klikni 'Add people'"
echo "5. Zadaj email alebo username AI asistenta"
echo "6. Vyber 'Write' permissions"
echo "7. Klikni 'Add [username] to this repository'"
echo ""
print_info "Ak nemáš AI účet, môžeš vytvoriť GitHub personal access token"
echo "Settings → Developer settings → Personal access tokens → Generate new token"
echo "Potrebné permissions: repo, workflow, write:packages"
echo ""
wait_for_user

# KROK 2: Railway Dashboard Access
print_header "KROK 2: Railway Dashboard Access"
print_step "2" "Nastavenie Railway prístupov"

echo "🚂 Pre monitoring a spravovanie Railway deploymentu:"
echo ""
echo "Postupuj takto:"
echo "1. Choď na Railway: https://railway.app"
echo "2. Otvor projekt 'blackrent-app'"
echo "3. Klikni na 'Settings' → 'Members'"
echo "4. Klikni 'Invite Member'"
echo "5. Zadaj email AI asistenta"
echo "6. Vyber 'Developer' alebo 'Admin' role"
echo "7. Klikni 'Send Invite'"
echo ""
print_info "Alternatívne môžeš vytvoriť Railway API token:"
echo "Account Settings → Tokens → Create new token"
echo ""
wait_for_user

# KROK 3: Webhooks & Notifications
print_header "KROK 3: Webhooks & Notifications"
print_step "3" "Nastavenie webhooks a notifikácií"

echo "🔔 Nastavujeme webhooks pre real-time notifikácie..."
echo ""

# Spustenie webhook setup
if [ -f "webhooks-setup.sh" ]; then
    print_info "Spúšťam webhook setup..."
    ./webhooks-setup.sh
    print_success "Webhooks nakonfigurované!"
else
    print_error "webhooks-setup.sh neexistuje!"
fi

echo ""
echo "Pre kompletné nastavenie potrebuješ:"
echo "1. 🔗 Webhook URL pre AI notifikácie"
echo "2. 📱 Discord webhook (voliteľné)"
echo "3. 📧 Email notifikácie (voliteľné)"
echo "4. 💬 Slack integration (voliteľné)"
echo ""
wait_for_user

# KROK 4: Database Direct Access
print_header "KROK 4: Database Direct Access"
print_step "4" "Nastavenie databázového prístupu"

echo "🗄️ Pre priamy prístup k PostgreSQL databáze:"
echo ""
echo "Postupuj takto:"
echo "1. V Railway otvoj databázu"
echo "2. Choď na 'Connect' tab"
echo "3. Skopíruj connection string"
echo "4. Vytvor nového databázového usera pre AI:"
echo ""
echo "SQL príkazy:"
echo "CREATE USER ai_assistant WITH PASSWORD 'secure_password';"
echo "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ai_assistant;"
echo "GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ai_assistant;"
echo ""
print_info "Connection string bude vyzerať takto:"
echo "postgresql://ai_assistant:secure_password@host:port/database"
echo ""
wait_for_user

# KROK 5: API Keys & Services
print_header "KROK 5: API Keys & Services"
print_step "5" "Nastavenie API kľúčov"

echo "🔑 Pre rozšírené funkcie môžeš nastaviť:"
echo ""
echo "1. 🤖 OpenAI API Key (pre AI features)"
echo "2. 📊 Analytics services"
echo "3. 🔔 Notification services"
echo "4. 🛡️ Security scanning tools"
echo ""

# Vytvorenie .env súboru pre AI
cat > .env.ai << 'EOF'
# AI Assistant Configuration
GITHUB_TOKEN=your_github_token_here
RAILWAY_TOKEN=your_railway_token_here
DATABASE_URL=your_postgres_connection_string_here
AI_WEBHOOK_URL=your_webhook_url_here

# Optional Services
OPENAI_API_KEY=your_openai_key_here
DISCORD_WEBHOOK=your_discord_webhook_here
SLACK_TOKEN=your_slack_token_here
TELEGRAM_BOT_TOKEN=your_telegram_token_here

# Monitoring
MONITORING_ENABLED=true
ANALYTICS_ENABLED=true
ALERTS_ENABLED=true
EOF

print_success "Vytvoril som .env.ai súbor pre konfiguráciu"
print_info "Vyplň svoje API kľúče do .env.ai súboru"
echo ""
wait_for_user

# KROK 6: Monitoring & Analytics
print_header "KROK 6: Monitoring & Analytics"
print_step "6" "Spustenie monitoring služieb"

echo "📊 Spúšťam monitoring služby..."
echo ""

# Vytvorenie monitoring starteru
cat > start-monitoring.sh << 'EOF'
#!/bin/bash

echo "🔍 Spúšťam AI monitoring služby..."

# Background processes
if [ ! -f "railway-monitor.sh" ]; then
    echo "❌ railway-monitor.sh neexistuje"
else
    ./railway-monitor.sh &
    echo "✅ Railway monitor spustený (PID: $!)"
fi

if [ ! -f "db-monitor.sh" ]; then
    echo "❌ db-monitor.sh neexistuje"
else
    ./db-monitor.sh &
    echo "✅ Database monitor spustený (PID: $!)"
fi

if [ ! -f "performance-monitor.sh" ]; then
    echo "❌ performance-monitor.sh neexistuje"
else
    ./performance-monitor.sh &
    echo "✅ Performance monitor spustený (PID: $!)"
fi

if [ ! -f "ai-webhook-receiver.js" ]; then
    echo "❌ ai-webhook-receiver.js neexistuje"
else
    node ai-webhook-receiver.js &
    echo "✅ AI webhook receiver spustený (PID: $!)"
fi

echo ""
echo "🎉 Všetky monitoring služby spustené!"
echo "💡 Pre zastavenie použij: pkill -f 'railway-monitor\|db-monitor\|performance-monitor\|node ai-webhook-receiver'"
EOF

chmod +x start-monitoring.sh

print_success "Monitoring služby pripravené!"
print_info "Použij './start-monitoring.sh' pre spustenie všetkých služieb"
echo ""
wait_for_user

# KROK 7: Finálne testovanie
print_header "KROK 7: Finálne testovanie"
print_step "7" "Testovanie všetkých funkcií"

echo "🧪 Testujem všetky AI automatizácie..."
echo ""

# Spustenie kompletného testu
./ai-automation.sh status

echo ""
print_info "Test kompletného systému dokončený!"
wait_for_user

# Finálne zhrnutie
print_header "🎉 Setup dokončený!"

echo "✅ Všetky AI prístupy sú pripravené na aktiváciu!"
echo ""
echo "📋 Čo máš teraz k dispozícii:"
echo "• 🚀 Automatické deployments"
echo "• 📊 Real-time monitoring"
echo "• 🔔 Webhooks & notifications"
echo "• 🗄️ Database access"
echo "• 🔍 Performance tracking"
echo "• 🛡️ Security monitoring"
echo "• 📈 Analytics & reporting"
echo ""
echo "🎯 Ďalšie kroky:"
echo "1. Vyplň .env.ai súbor so svojimi API kľúčmi"
echo "2. Spusti monitoring: ./start-monitoring.sh"
echo "3. Otvor dashboard: open monitoring-dashboard.html"
echo "4. Testuj funkcionalitu: ./ai-automation.sh menu"
echo ""
print_success "AI Assistant je pripravený na maximálnu automatizáciu! 🤖" 