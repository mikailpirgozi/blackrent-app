#!/bin/bash

# Blackrent Production Deployment Script
# Autor: Assistant
# Popis: Script na nasadenie Blackrent aplikácie na server

set -e

echo "🚀 Blackrent Production Deployment"
echo "================================="

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcie
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Kontrola závislostí
check_dependencies() {
    log_info "Kontrolujem závislosti..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker nie je nainštalovaný"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose nie je nainštalovaný"
        exit 1
    fi
    
    log_success "Závislosti sú v poriadku"
}

# Kontrola .env súboru
check_env() {
    log_info "Kontrolujem environment súbor..."
    
    if [ ! -f .env ]; then
        log_warning ".env súbor neexistuje, kopírujem z production.env"
        cp production.env .env
        log_warning "DÔLEŽITÉ: Upravte .env súbor s vašimi nastaveniami!"
        log_warning "Najmä: DB_PASSWORD, JWT_SECRET, FRONTEND_URL, DOMAIN"
        read -p "Stlačte Enter po úprave .env súboru..."
    fi
    
    log_success "Environment súbor existuje"
}

# Build aplikácie
build_app() {
    log_info "Buildovanie aplikácie..."
    
    # Zastavenie ak beží
    docker-compose down 2>/dev/null || true
    
    # Build
    docker-compose build --no-cache
    
    log_success "Aplikácia úspešne zbuildovaná"
}

# Spustenie aplikácie
start_app() {
    log_info "Spúšťam aplikáciu..."
    
    # Vytvorenie potrebných priečinkov
    mkdir -p logs backup nginx/ssl
    
    # Spustenie
    docker-compose up -d
    
    log_success "Aplikácia úspešne spustená"
}

# Kontrola zdravia
health_check() {
    log_info "Kontrolujem zdravie aplikácie..."
    
    sleep 10
    
    # Kontrola PostgreSQL
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL beží v poriadku"
    else
        log_error "PostgreSQL nebeží správne"
        return 1
    fi
    
    # Kontrola Blackrent aplikácie
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
            log_success "Blackrent aplikácia beží v poriadku"
            return 0
        fi
        
        log_info "Čakám na spustenie aplikácie... pokus $attempt/$max_attempts"
        sleep 5
        ((attempt++))
    done
    
    log_error "Aplikácia sa nespustila do 5 minút"
    return 1
}

# SSL certifikáty
setup_ssl() {
    log_info "Nastavujem SSL certifikáty..."
    
    if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then
        log_warning "SSL certifikáty nenájdené"
        log_info "Pre Let's Encrypt certifikáty použite:"
        log_info "sudo certbot certonly --webroot -w /var/www/certbot -d vasa-domena.sk"
        log_info "Potom skopírujte certifikáty do nginx/ssl/"
        
        # Vytvorenie self-signed certifikátov pre test
        log_info "Vytváram dočasné self-signed certifikáty..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/privkey.pem \
            -out nginx/ssl/fullchain.pem \
            -subj "/C=SK/ST=Slovakia/L=Bratislava/O=Blackrent/CN=localhost"
        
        log_warning "Používajú sa dočasné certifikáty! Nastavte správne SSL pre produkciu"
    else
        log_success "SSL certifikáty sú nastavené"
    fi
}

# Backup databázy
backup_db() {
    log_info "Vytváram zálohu databázy..."
    
    docker-compose run --rm backup
    
    log_success "Záloha vytvorená"
}

# Zobrazenie logov
show_logs() {
    log_info "Posledných 50 riadkov logov:"
    docker-compose logs --tail=50
}

# Cleanup
cleanup() {
    log_info "Čistím staré Docker images..."
    docker system prune -f
    log_success "Cleanup dokončený"
}

# Hlavné menu
main() {
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            check_env
            build_app
            setup_ssl
            start_app
            health_check
            log_success "🎉 Deployment dokončený!"
            log_info "Aplikácia beží na: http://localhost:5001"
            log_info "Pre HTTPS: https://vasa-domena.sk (po nastavení SSL)"
            log_info "Admin prístup: admin / admin123"
            ;;
        "start")
            start_app
            health_check
            ;;
        "stop")
            log_info "Zastavujem aplikáciu..."
            docker-compose down
            log_success "Aplikácia zastavená"
            ;;
        "restart")
            log_info "Reštartujem aplikáciu..."
            docker-compose restart
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "backup")
            backup_db
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            docker-compose ps
            ;;
        *)
            echo "Použitie: $0 {deploy|start|stop|restart|logs|backup|cleanup|status}"
            echo ""
            echo "Príkazy:"
            echo "  deploy   - Kompletné nasadenie (default)"
            echo "  start    - Spustenie aplikácie"
            echo "  stop     - Zastavenie aplikácie"
            echo "  restart  - Reštart aplikácie"
            echo "  logs     - Zobrazenie logov"
            echo "  backup   - Záloha databázy"
            echo "  cleanup  - Vyčistenie starých images"
            echo "  status   - Stav kontajnerov"
            exit 1
            ;;
    esac
}

# Spustenie
main "$@" 