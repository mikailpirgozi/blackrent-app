#!/bin/bash

# BlackRent R2 CLI Helper Script
# Provides easy access to common R2 operations via Wrangler CLI

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="${R2_BUCKET_NAME:-blackrent}"
ACCOUNT_ID="${R2_ACCOUNT_ID:-}"

# Helper functions
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

check_credentials() {
  if [ -z "$ACCOUNT_ID" ]; then
    print_error "R2_ACCOUNT_ID is not set!"
    print_info "Run: export R2_ACCOUNT_ID=your-account-id"
    print_info "Or add it to .dev.vars file"
    exit 1
  fi
}

show_help() {
  cat << EOF
${BLUE}BlackRent R2 CLI Helper${NC}

Usage: ./scripts/r2-cli.sh <command> [options]

Commands:
  ${GREEN}list${NC}                      List all objects in bucket
  ${GREEN}list <prefix>${NC}             List objects with prefix (e.g., uploads/2025/)
  ${GREEN}get <key>${NC}                 Download object from R2
  ${GREEN}put <file> <key>${NC}          Upload file to R2
  ${GREEN}delete <key>${NC}              Delete object from R2
  ${GREEN}info <key>${NC}                Get object metadata
  ${GREEN}stats${NC}                     Show bucket statistics
  ${GREEN}cleanup-old${NC}               Delete files older than 90 days
  ${GREEN}auth${NC}                      Test R2 authentication
  ${GREEN}help${NC}                      Show this help message

Examples:
  ./scripts/r2-cli.sh list
  ./scripts/r2-cli.sh list uploads/protocols/
  ./scripts/r2-cli.sh get uploads/photo.jpg
  ./scripts/r2-cli.sh put image.jpg uploads/2025/image.jpg
  ./scripts/r2-cli.sh delete uploads/old-file.pdf
  ./scripts/r2-cli.sh stats
  ./scripts/r2-cli.sh cleanup-old

Environment Variables:
  R2_ACCOUNT_ID       Cloudflare Account ID (required)
  R2_BUCKET_NAME      R2 Bucket name (default: blackrent)

Setup:
  1. Copy .dev.vars.example to .dev.vars
  2. Fill in your R2 credentials
  3. Run: source .dev.vars
  4. Run: ./scripts/r2-cli.sh auth

EOF
}

# Commands
cmd_list() {
  check_credentials
  local prefix="${1:-}"
  
  print_info "Listing objects in bucket: $BUCKET_NAME"
  if [ -n "$prefix" ]; then
    print_info "Prefix: $prefix"
    pnpm wrangler r2 object list "$BUCKET_NAME" --prefix "$prefix"
  else
    pnpm wrangler r2 object list "$BUCKET_NAME"
  fi
}

cmd_get() {
  check_credentials
  local key="$1"
  local output="${2:-$(basename "$key")}"
  
  print_info "Downloading: $key → $output"
  pnpm wrangler r2 object get "$BUCKET_NAME/$key" --file "$output"
  print_success "Downloaded to: $output"
}

cmd_put() {
  check_credentials
  local file="$1"
  local key="$2"
  
  if [ ! -f "$file" ]; then
    print_error "File not found: $file"
    exit 1
  fi
  
  print_info "Uploading: $file → $key"
  pnpm wrangler r2 object put "$BUCKET_NAME/$key" --file "$file"
  print_success "Uploaded: $key"
}

cmd_delete() {
  check_credentials
  local key="$1"
  
  print_warning "Deleting: $key"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm wrangler r2 object delete "$BUCKET_NAME/$key"
    print_success "Deleted: $key"
  else
    print_info "Cancelled"
  fi
}

cmd_info() {
  check_credentials
  local key="$1"
  
  print_info "Object metadata: $key"
  pnpm wrangler r2 object get "$BUCKET_NAME/$key" --metadata-only
}

cmd_stats() {
  check_credentials
  
  print_info "Bucket: $BUCKET_NAME"
  print_info "Getting bucket statistics..."
  
  # Count objects
  local count=$(pnpm wrangler r2 object list "$BUCKET_NAME" | grep -c "key:" || echo "0")
  print_success "Total objects: $count"
  
  # Show top-level directories
  print_info "Top-level directories:"
  pnpm wrangler r2 object list "$BUCKET_NAME" --delimiter "/" | grep "key:" | head -n 20
}

cmd_auth() {
  print_info "Testing R2 authentication..."
  
  if [ -z "$ACCOUNT_ID" ]; then
    print_error "R2_ACCOUNT_ID is not set!"
    exit 1
  fi
  
  print_info "Account ID: $ACCOUNT_ID"
  print_info "Bucket: $BUCKET_NAME"
  
  # Try to list bucket
  if pnpm wrangler r2 object list "$BUCKET_NAME" --limit 1 > /dev/null 2>&1; then
    print_success "Authentication successful!"
    print_success "You can access bucket: $BUCKET_NAME"
  else
    print_error "Authentication failed!"
    print_error "Check your credentials in .dev.vars"
    exit 1
  fi
}

cmd_cleanup_old() {
  check_credentials
  
  print_warning "This will delete all files older than 90 days"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Cancelled"
    exit 0
  fi
  
  print_info "Finding files older than 90 days..."
  local cutoff_date=$(date -u -v-90d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '90 days ago' +%Y-%m-%dT%H:%M:%SZ)
  
  print_info "Cutoff date: $cutoff_date"
  print_warning "This is a dry run. Review the list below:"
  
  # Note: Wrangler doesn't support filtering by date directly
  # This would need a custom script with AWS SDK
  print_warning "This feature requires custom implementation with AWS SDK"
  print_info "For now, use: pnpm run r2:cleanup-old-node"
}

# Main
main() {
  local command="${1:-help}"
  shift || true
  
  case "$command" in
    list)
      cmd_list "$@"
      ;;
    get)
      if [ $# -lt 1 ]; then
        print_error "Usage: r2-cli.sh get <key> [output-file]"
        exit 1
      fi
      cmd_get "$@"
      ;;
    put)
      if [ $# -lt 2 ]; then
        print_error "Usage: r2-cli.sh put <file> <key>"
        exit 1
      fi
      cmd_put "$@"
      ;;
    delete)
      if [ $# -lt 1 ]; then
        print_error "Usage: r2-cli.sh delete <key>"
        exit 1
      fi
      cmd_delete "$@"
      ;;
    info)
      if [ $# -lt 1 ]; then
        print_error "Usage: r2-cli.sh info <key>"
        exit 1
      fi
      cmd_info "$@"
      ;;
    stats)
      cmd_stats
      ;;
    auth)
      cmd_auth
      ;;
    cleanup-old)
      cmd_cleanup_old
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      print_error "Unknown command: $command"
      echo
      show_help
      exit 1
      ;;
  esac
}

main "$@"

