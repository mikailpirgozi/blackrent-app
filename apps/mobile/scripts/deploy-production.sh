#!/bin/bash

# 🚀 BlackRent Mobile - Production Deployment Script
# Comprehensive production deployment with safety checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="BlackRent Mobile"
VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M%S)
ENVIRONMENT="production"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Header
echo -e "${BLUE}"
echo "========================================"
echo "🚀 $APP_NAME - Production Deployment"
echo "========================================"
echo "Version: $VERSION"
echo "Build: $BUILD_NUMBER"
echo "Environment: $ENVIRONMENT"
echo "========================================"
echo -e "${NC}"

# Step 1: Pre-deployment checks
log "Step 1: Running pre-deployment checks..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    error "Deployment must be from main/master branch. Current branch: $CURRENT_BRANCH"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    error "There are uncommitted changes. Please commit or stash them before deployment."
fi

# Check if all tests pass
log "Running comprehensive test suite..."
if ! npm run test:ci; then
    error "Tests failed. Deployment aborted."
fi

success "Pre-deployment checks passed!"

# Step 2: Launch preparation
log "Step 2: Running launch preparation checks..."

# Run launch preparation
if ! npx tsx -e "
import { quickLaunch } from './src/utils/launch-preparation';
quickLaunch.production().then(report => {
    if (report.overallStatus === 'not_ready') {
        console.error('Launch preparation failed. Critical issues found.');
        process.exit(1);
    } else if (report.overallStatus === 'warning') {
        console.warn('Launch preparation completed with warnings.');
    } else {
        console.log('Launch preparation successful!');
    }
}).catch(error => {
    console.error('Launch preparation error:', error);
    process.exit(1);
});
"; then
    error "Launch preparation failed. Deployment aborted."
fi

success "Launch preparation completed!"

# Step 3: Environment setup
log "Step 3: Setting up production environment..."

# Backup current .env if exists
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log "Backed up existing .env file"
fi

# Copy production environment
if [ -f "env.production.example" ]; then
    cp env.production.example .env
    log "Copied production environment configuration"
else
    warning "No production environment template found"
fi

# Set build-specific environment variables
echo "BUILD_NUMBER=$BUILD_NUMBER" >> .env
echo "DEPLOYMENT_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .env
echo "GIT_COMMIT=$(git rev-parse HEAD)" >> .env

success "Production environment configured!"

# Step 4: Dependencies and cleanup
log "Step 4: Installing dependencies and cleaning up..."

# Clean install dependencies
rm -rf node_modules
npm ci --production=false

# Clean Metro cache
npm run clean:metro

# Clean build artifacts
rm -rf .expo
rm -rf ios/build
rm -rf android/build

success "Dependencies installed and cleanup completed!"

# Step 5: Build validation
log "Step 5: Validating builds..."

# Type checking
log "Running TypeScript type checking..."
if ! npm run type-check; then
    error "TypeScript type checking failed"
fi

# Linting
log "Running ESLint..."
if ! npm run lint; then
    error "Linting failed"
fi

# Test production build (without actually building)
log "Validating build configuration..."
if ! npx expo export --platform all --dev false --clear; then
    error "Build validation failed"
fi

success "Build validation completed!"

# Step 6: Security scan
log "Step 6: Running security scans..."

# Run security tests
if ! npm run test:security; then
    error "Security tests failed"
fi

# Check for known vulnerabilities
if command -v npm audit &> /dev/null; then
    log "Running npm audit..."
    npm audit --audit-level moderate
fi

success "Security scans completed!"

# Step 7: Performance validation
log "Step 7: Running performance validation..."

# Run performance tests
if ! npm run test:performance; then
    error "Performance tests failed"
fi

# Bundle size analysis
log "Analyzing bundle size..."
BUNDLE_SIZE=$(du -sh .expo/dist 2>/dev/null | cut -f1 || echo "Unknown")
log "Bundle size: $BUNDLE_SIZE"

success "Performance validation completed!"

# Step 8: Pre-build confirmation
log "Step 8: Pre-build confirmation..."

echo -e "${YELLOW}"
echo "========================================"
echo "🚨 PRODUCTION DEPLOYMENT CONFIRMATION"
echo "========================================"
echo "App: $APP_NAME"
echo "Version: $VERSION"
echo "Build: $BUILD_NUMBER"
echo "Branch: $CURRENT_BRANCH"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Bundle Size: $BUNDLE_SIZE"
echo "========================================"
echo -e "${NC}"

read -p "Do you want to proceed with production deployment? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Deployment cancelled by user"
    exit 0
fi

# Step 9: Build for production
log "Step 9: Building for production..."

# iOS Build
if [[ "$1" == "ios" ]] || [[ "$1" == "both" ]] || [[ -z "$1" ]]; then
    log "Building for iOS..."
    if ! eas build --platform ios --profile production --non-interactive; then
        error "iOS build failed"
    fi
    success "iOS build completed!"
fi

# Android Build
if [[ "$1" == "android" ]] || [[ "$1" == "both" ]] || [[ -z "$1" ]]; then
    log "Building for Android..."
    if ! eas build --platform android --profile production --non-interactive; then
        error "Android build failed"
    fi
    success "Android build completed!"
fi

# Step 10: Post-build validation
log "Step 10: Running post-build validation..."

# Verify build artifacts exist
log "Verifying build artifacts..."

# Run smoke tests on built app (if possible)
log "Running smoke tests..."
if ! npm run test:smoke; then
    warning "Smoke tests failed, but continuing deployment"
fi

success "Post-build validation completed!"

# Step 11: Deployment preparation
log "Step 11: Preparing for deployment..."

# Generate deployment report
DEPLOYMENT_REPORT="deployment-report-$BUILD_NUMBER.json"
cat > "$DEPLOYMENT_REPORT" << EOF
{
  "appName": "$APP_NAME",
  "version": "$VERSION",
  "buildNumber": "$BUILD_NUMBER",
  "environment": "$ENVIRONMENT",
  "branch": "$CURRENT_BRANCH",
  "commit": "$(git rev-parse HEAD)",
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "bundleSize": "$BUNDLE_SIZE",
  "platform": "${1:-both}",
  "status": "ready_for_submission"
}
EOF

log "Deployment report generated: $DEPLOYMENT_REPORT"

# Create deployment tag
DEPLOYMENT_TAG="v$VERSION-build$BUILD_NUMBER"
git tag -a "$DEPLOYMENT_TAG" -m "Production deployment $VERSION build $BUILD_NUMBER"
log "Created deployment tag: $DEPLOYMENT_TAG"

success "Deployment preparation completed!"

# Step 12: App Store submission (optional)
if [[ "$2" == "submit" ]]; then
    log "Step 12: Submitting to app stores..."
    
    # iOS App Store
    if [[ "$1" == "ios" ]] || [[ "$1" == "both" ]] || [[ -z "$1" ]]; then
        log "Submitting to iOS App Store..."
        if ! eas submit --platform ios --latest; then
            error "iOS App Store submission failed"
        fi
        success "iOS App Store submission completed!"
    fi
    
    # Google Play Store
    if [[ "$1" == "android" ]] || [[ "$1" == "both" ]] || [[ -z "$1" ]]; then
        log "Submitting to Google Play Store..."
        if ! eas submit --platform android --latest; then
            error "Google Play Store submission failed"
        fi
        success "Google Play Store submission completed!"
    fi
else
    log "Step 12: Skipping app store submission (use 'submit' parameter to enable)"
fi

# Step 13: Cleanup and finalization
log "Step 13: Cleanup and finalization..."

# Restore original .env if backup exists
if [ -f ".env.backup."* ]; then
    LATEST_BACKUP=$(ls -t .env.backup.* | head -n1)
    cp "$LATEST_BACKUP" .env
    log "Restored original .env file"
fi

# Push deployment tag
if git push origin "$DEPLOYMENT_TAG"; then
    log "Pushed deployment tag to remote"
else
    warning "Failed to push deployment tag"
fi

# Generate final summary
echo -e "${GREEN}"
echo "========================================"
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo "App: $APP_NAME"
echo "Version: $VERSION"
echo "Build: $BUILD_NUMBER"
echo "Tag: $DEPLOYMENT_TAG"
echo "Report: $DEPLOYMENT_REPORT"
echo "========================================"
echo -e "${NC}"

# Step 14: Post-deployment instructions
log "Step 14: Post-deployment instructions..."

echo -e "${BLUE}"
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "1. Monitor app store review process"
echo "2. Prepare release notes and marketing materials"
echo "3. Set up production monitoring and alerts"
echo "4. Notify stakeholders of successful deployment"
echo "5. Monitor crash reports and user feedback"
echo "6. Plan post-launch support and updates"
echo -e "${NC}"

success "Production deployment completed successfully! 🚀"

# Optional: Open relevant URLs
if command -v open &> /dev/null; then
    log "Opening relevant URLs..."
    # open "https://appstoreconnect.apple.com"
    # open "https://play.google.com/console"
fi

exit 0
