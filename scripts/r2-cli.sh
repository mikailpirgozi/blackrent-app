#!/bin/bash

# Blackrent R2 CLI Helper
# Usage: ./scripts/r2-cli.sh [command]

R2_ENDPOINT="https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
R2_BUCKET="blackrent-storage"
AWS_PROFILE="r2"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Blackrent R2 CLI ===${NC}\n"

# Function to run AWS S3 commands with R2 endpoint
r2() {
    aws s3 "$@" --profile "$AWS_PROFILE" --endpoint-url "$R2_ENDPOINT"
}

# Parse command
case "$1" in
    "ls"|"list")
        echo -e "${GREEN}Listing bucket contents...${NC}"
        if [ -z "$2" ]; then
            r2 ls "s3://$R2_BUCKET/"
        else
            r2 ls "s3://$R2_BUCKET/$2"
        fi
        ;;
    
    "tree")
        echo -e "${GREEN}Showing bucket tree...${NC}"
        r2 ls "s3://$R2_BUCKET/" --recursive
        ;;
    
    "upload")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}Usage: ./scripts/r2-cli.sh upload <local-file> <r2-path>${NC}"
            exit 1
        fi
        echo -e "${GREEN}Uploading $2 to s3://$R2_BUCKET/$3${NC}"
        r2 cp "$2" "s3://$R2_BUCKET/$3"
        ;;
    
    "download")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}Usage: ./scripts/r2-cli.sh download <r2-path> <local-file>${NC}"
            exit 1
        fi
        echo -e "${GREEN}Downloading s3://$R2_BUCKET/$2 to $3${NC}"
        r2 cp "s3://$R2_BUCKET/$2" "$3"
        ;;
    
    "sync")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}Usage: ./scripts/r2-cli.sh sync <local-dir> <r2-path>${NC}"
            exit 1
        fi
        echo -e "${GREEN}Syncing $2 to s3://$R2_BUCKET/$3${NC}"
        r2 sync "$2" "s3://$R2_BUCKET/$3"
        ;;
    
    "rm"|"delete")
        if [ -z "$2" ]; then
            echo -e "${RED}Usage: ./scripts/r2-cli.sh delete <r2-path>${NC}"
            exit 1
        fi
        echo -e "${RED}Deleting s3://$R2_BUCKET/$2${NC}"
        r2 rm "s3://$R2_BUCKET/$2"
        ;;
    
    "presign")
        if [ -z "$2" ]; then
            echo -e "${RED}Usage: ./scripts/r2-cli.sh presign <r2-path> [expiry-seconds]${NC}"
            exit 1
        fi
        EXPIRY="${3:-3600}"
        echo -e "${GREEN}Generating presigned URL (expires in ${EXPIRY}s)...${NC}"
        aws s3 presign "s3://$R2_BUCKET/$2" \
            --profile "$AWS_PROFILE" \
            --endpoint-url "$R2_ENDPOINT" \
            --expires-in "$EXPIRY"
        ;;
    
    "info")
        echo -e "${GREEN}R2 Configuration:${NC}"
        echo "Endpoint: $R2_ENDPOINT"
        echo "Bucket: $R2_BUCKET"
        echo "Profile: $AWS_PROFILE"
        echo ""
        echo -e "${GREEN}Bucket size:${NC}"
        r2 ls "s3://$R2_BUCKET/" --recursive --summarize | tail -2
        ;;
    
    "help"|*)
        echo -e "${GREEN}Available commands:${NC}"
        echo "  ls [path]              - List bucket contents"
        echo "  tree                   - Show all files recursively"
        echo "  upload <file> <path>   - Upload file to R2"
        echo "  download <path> <file> - Download file from R2"
        echo "  sync <dir> <path>      - Sync directory to R2"
        echo "  delete <path>          - Delete file from R2"
        echo "  presign <path> [secs]  - Generate presigned URL"
        echo "  info                   - Show R2 configuration and stats"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo "  ./scripts/r2-cli.sh ls protocols/"
        echo "  ./scripts/r2-cli.sh upload ./file.pdf documents/file.pdf"
        echo "  ./scripts/r2-cli.sh download protocols/abc.pdf ./download.pdf"
        echo "  ./scripts/r2-cli.sh presign documents/report.pdf 7200"
        ;;
esac

