#!/bin/bash

# 🚀 Cloudflare R2 Setup - Interactive Guide
echo "☁️  CLOUDFLARE R2 SETUP FOR BLACKRENT"
echo "===================================="
echo ""

# Colors  
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Functions
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
    echo -e "${YELLOW}�� $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

wait_for_user() {
    echo -e "${YELLOW}👉 Stlač Enter po dokončení...${NC}"
    read -r
}

# Úvod
print_header "Automatické nastavenie Cloudflare R2"

echo "Tento setup ťa prevedie cez:"
echo "1. 🪣  Vytvorenie R2 bucket"
echo "2. 🔑 Generovanie API tokenov"
echo "3. 🌐 Nastavenie public access"
echo "4. 🚂 Konfigurácia Railway variables"
echo "5. ✅ Test funkčnosti"
echo ""
echo "🎯 Výsledok: Plne funkčný file storage pre BlackRent"
echo ""
echo -e "${YELLOW}Pokračujeme? (Enter pre pokračovanie)${NC}"
read -r

# KROK 1: Account a Dashboard
print_header "KROK 1: Cloudflare Dashboard"
print_step "1" "Otvorenie Cloudflare Dashboard"

echo "🌐 Otvor v prehliadači:"
echo -e "${CYAN}https://dash.cloudflare.com${NC}"
echo ""
echo "📝 Ak nemáš Cloudflare účet:"
echo "1. Klikni na 'Sign Up'"  
echo "2. Vyplň registračný formulár"
echo "3. Potvrď email"
echo ""
echo "💳 Pre R2 potrebuješ platobný spôsob (bezplatný tier: 10GB)"
echo ""
wait_for_user

# KROK 2: R2 Dashboard
print_header "KROK 2: R2 Object Storage"  
print_step "2" "Navigácia na R2 sekciu"

echo "🗂️  V Cloudflare dashboard:"
echo "1. V ľavom menu nájdi a klikni na 'R2 Object Storage'"
echo "2. Klikni na 'Overview'"
echo "3. Uvidíš R2 dashboard"
echo ""
print_info "Ak sa ti zobrazí 'Purchase R2', klikni na to a aktivuj R2 službu"
echo ""
wait_for_user

# KROK 3: Account ID
print_header "KROK 3: Account ID"
print_step "3" "Získanie Account ID"

echo "🆔 Získaj svoj Account ID:"
echo "1. V R2 dashboard, vpravo nájdi 'API' tlačidlo" 
echo "2. Klikni na 'API' → 'Use R2 with APIs'"
echo "3. V popup okne uvidíš 'Account ID'"
echo "4. Skopíruj Account ID"
echo ""
echo "Alternatívne:"
echo "- Account ID nájdeš v URL: https://dash.cloudflare.com/[ACCOUNT_ID]/r2"
echo ""
echo -e "${YELLOW}Zadaj svoj Account ID:${NC}"
read -r ACCOUNT_ID

if [ -z "$ACCOUNT_ID" ]; then
    print_error "Account ID je povinné!"
    exit 1
fi

print_success "Account ID: $ACCOUNT_ID"

# KROK 4: Vytvorenie bucket
print_header "KROK 4: Vytvorenie R2 Bucket"
print_step "4" "Vytvorenie storage bucket"

echo "🪣  Vytvor nový bucket:"
echo "1. V R2 dashboard klikni 'Create bucket'"
echo "2. Bucket name: 'blackrent-storage'"
echo "3. Location: 'Automatic' (nechaj default)"
echo "4. Klikni 'Create bucket'"
echo ""
echo -e "${YELLOW}Potvrď, že si vytvoril bucket 'blackrent-storage' (y/n):${NC}"
read -r BUCKET_CONFIRM

if [[ "$BUCKET_CONFIRM" != "y" ]]; then
    print_error "Prosím vytvor bucket a spusti script znova"
    exit 1
fi

print_success "Bucket 'blackrent-storage' vytvorený"

# KROK 5: Public Access
print_header "KROK 5: Public Access"
print_step "5" "Nastavenie verejného prístupu"

echo "🌐 Povolenie public access:"
echo "1. Otvor svoj nový bucket 'blackrent-storage'"
echo "2. Choď na 'Settings' tab"
echo "3. Nájdi 'R2.dev subdomain' sekciu"
echo "4. Klikni 'Allow Access'"
echo "5. Napíš 'allow' pre potvrdenie"
echo "6. Klikni 'Allow'"
echo ""
echo "📋 Skopíruj Public URL (bude vyzerať ako):"
echo -e "${CYAN}https://pub-[random-string].r2.dev${NC}"
echo ""
echo -e "${YELLOW}Zadaj svoju R2 Public URL:${NC}"
read -r PUBLIC_URL

if [ -z "$PUBLIC_URL" ]; then
    print_error "Public URL je povinné!"
    exit 1
fi

print_success "Public URL: $PUBLIC_URL"

# KROK 6: API Token
print_header "KROK 6: API Token"
print_step "6" "Vytvorenie API tokenu"

echo "🔑 Vytvorenie API tokenu:"
echo "1. Choď späť do R2 dashboard"
echo "2. Klikni 'API' → 'Manage R2 API Tokens'"
echo "3. Klikni 'Create API Token'"
echo ""
echo "📋 Nastavenia tokenu:"
echo "   • Token Name: 'BlackRent Storage'"
echo "   • Permissions: 'Object Read & Write'"
echo "   • Bucket Scope: 'Apply to specific buckets'"
echo "   • Select Bucket: 'blackrent-storage'"
echo ""
echo "4. Klikni 'Create API Token'"
echo ""
echo "⚠️  Dôležité: Token sa zobrazí len raz!"
echo ""
wait_for_user

echo -e "${YELLOW}Zadaj Access Key ID:${NC}"
read -r ACCESS_KEY_ID

if [ -z "$ACCESS_KEY_ID" ]; then
    print_error "Access Key ID je povinné!"
    exit 1
fi

echo -e "${YELLOW}Zadaj Secret Access Key:${NC}"
read -s SECRET_ACCESS_KEY
echo ""

if [ -z "$SECRET_ACCESS_KEY" ]; then
    print_error "Secret Access Key je povinné!"
    exit 1
fi

# KROK 7: Endpoint URL
ENDPOINT_URL="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"

print_success "Access Key ID: $ACCESS_KEY_ID"
print_success "Secret Access Key: [HIDDEN]"
print_success "Endpoint URL: $ENDPOINT_URL"

# KROK 8: Uloženie konfigurácie
print_header "KROK 7: Uloženie konfigurácie"
print_step "7" "Vytvorenie konfiguračných súborov"

# Vytvorenie .env súboru s R2 nastaveniami
cat > .env.r2 << EOF
# Cloudflare R2 Configuration for BlackRent
R2_ENDPOINT=${ENDPOINT_URL}
R2_BUCKET_NAME=blackrent-storage
R2_ACCESS_KEY_ID=${ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}
R2_ACCOUNT_ID=${ACCOUNT_ID}
R2_PUBLIC_URL=${PUBLIC_URL}
