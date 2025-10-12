#!/bin/bash

# BMW X5 Files Delete Script
# WARNING: This will permanently delete 427 files (1.2 GB) from R2

set -e

R2_ENDPOINT="https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
R2_BUCKET="blackrent-storage"
AWS_PROFILE="r2"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}  BMW X5 DELETE SCRIPT${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete:${NC}"
echo "  - 427 files"
echo "  - 1.2 GB total size"
echo "  - All BMW X5 protocols and photos"
echo ""
echo -e "${YELLOW}Directories to be deleted:${NC}"
echo "  1. 2025/08/BlackRent_Official/BMW_X5_-_zalo_ena_C95246/"
echo "  2. 2025/08/BlackRent_Official/BMW_X5_WS-FIX-TEST/"
echo "  3. 2025/08/Miki/Bmw_X5_-_zalo_ena_C95246/"
echo ""

# Confirm deletion
read -p "$(echo -e ${RED}Type \'DELETE BMW X5\' to confirm deletion:${NC} )" CONFIRM

if [ "$CONFIRM" != "DELETE BMW X5" ]; then
    echo -e "${GREEN}✅ Deletion cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting deletion...${NC}"
echo ""

# Function to delete directory
delete_dir() {
    local dir=$1
    echo -e "${YELLOW}Deleting: $dir${NC}"
    aws s3 rm "s3://$R2_BUCKET/$dir" \
        --recursive \
        --profile "$AWS_PROFILE" \
        --endpoint-url "$R2_ENDPOINT"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully deleted: $dir${NC}"
    else
        echo -e "${RED}❌ Failed to delete: $dir${NC}"
        return 1
    fi
    echo ""
}

# Delete each directory
delete_dir "2025/08/BlackRent_Official/BMW_X5_-_zalo_ena_C95246/"
delete_dir "2025/08/BlackRent_Official/BMW_X5_WS-FIX-TEST/"
delete_dir "2025/08/Miki/Bmw_X5_-_zalo_ena_C95246/"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  BMW X5 FILES DELETED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Freed space: ~1.2 GB${NC}"
echo -e "${BLUE}Files deleted: 427${NC}"
echo ""
echo -e "${YELLOW}Backup report: docs/BMW_X5_DELETE_REPORT.md${NC}"
echo -e "${YELLOW}Full file list: /tmp/bmw-x5-files.txt${NC}"

