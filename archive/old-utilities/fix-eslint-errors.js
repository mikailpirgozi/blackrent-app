#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Zoznam súborov s chybami
const filesWithErrors = [
  'src/components/admin/CacheMonitoring.tsx',
  'src/components/admin/VehicleOwnershipTransfer.tsx',
  'src/components/auth/LoginForm.tsx',
  'src/components/common/EnhancedErrorToast.tsx',
  'src/components/common/ErrorBoundary.tsx',
  'src/components/common/ErrorToastContainer.tsx',
  'src/components/common/InfiniteScrollContainer.tsx',
  'src/components/common/LazyDetailView.tsx',
  'src/components/common/LoadingStates.tsx',
  'src/components/common/NativeCamera.tsx',
  'src/components/common/OfflineIndicator.tsx',
  'src/components/common/OptimizedImage.tsx',
  'src/components/common/PDFViewer.tsx',
  'src/components/common/PWAInstallPrompt.tsx',
  'src/components/common/PerformanceOptimizedList.tsx',
  'src/components/common/PermissionGuard.tsx',
  'src/components/common/QuickFilters.tsx',
  'src/components/common/R2FileUpload.tsx',
  'src/components/common/RealTimeNotifications.tsx',
  'src/components/common/SuccessToast.tsx',
  'src/components/companies/CompanyDocumentManager.tsx',
  'src/components/customers/CustomerCard.tsx',
  'src/components/email-management/EmailManagementLayout.tsx',
  'src/components/email-management/components/EmailArchiveTab.tsx',
  'src/components/email-management/components/PendingRentalsTab.tsx',
  'src/components/email-management/hooks/useEmailApi.ts',
  'src/components/email-management/types/email-types.ts',
  'src/components/expenses/ExpenseCategoryManager.tsx',
  'src/components/expenses/ExpenseForm.tsx',
  'src/components/expenses/RecurringExpenseManager.tsx',
  'src/components/insurances/InsuranceClaimForm.tsx',
  'src/components/insurances/InsuranceForm.tsx',
  'src/components/insurances/InsuranceList.tsx',
  'src/components/rentals/EmailParser.tsx',
  'src/components/rentals/PendingRentalsManager.tsx',
  'src/components/rentals/RentalCardView.tsx',
  'src/components/rentals/RentalFilters.tsx',
  'src/components/rentals/RentalMobileCard.tsx',
  'src/components/rentals/components/RentalCard.tsx',
  'src/components/rentals/components/RentalFilters.tsx',
  'src/components/rentals/components/RentalProtocols.tsx',
  'src/components/rentals/components/RentalRow.tsx',
  'src/components/rentals/components/RentalSearchAndFilters.tsx',
  'src/components/rentals/components/RentalStatusChip.tsx',
  'src/components/rentals/utils/rentalUtils.ts',
  'src/components/settlements/SettlementDetail.tsx',
  'src/components/statistics/ChartsTab.tsx',
  'src/components/statistics/CompaniesTab.tsx',
  'src/components/statistics/CustomTooltip.tsx',
  'src/components/statistics/StatisticsCard.tsx',
  'src/components/statistics/TopListCard.tsx',
  'src/components/statistics/TopStatCard.tsx',
  'src/components/statistics/TopStatsTab.tsx',
  'src/components/ui/UnifiedChip.tsx',
  'src/components/ui/index.ts',
  'src/components/users/IntegratedUserManagement.tsx',
  'src/components/users/UserCompanyPermissions.tsx',
  'src/components/users/UserProfile.tsx',
  'src/components/vehicles/VehicleImage.tsx',
  'src/components/vehicles/components/InvestorCard.tsx',
  'src/components/vehicles/components/OwnerCard.tsx',
  'src/components/vehicles/components/VehicleActions.tsx',
  'src/components/vehicles/components/VehicleDialogs.tsx',
  'src/components/vehicles/components/VehicleImportExport.tsx',
  'src/components/vehicles/components/VehicleTable.tsx',
  'src/context/ErrorContext.tsx',
  'src/context/PermissionsContext.tsx',
  'src/hooks/useApiService.ts',
  'src/hooks/useLazyImage.ts',
  'src/hooks/useOptimizedFilters.ts',
  'src/hooks/usePermissions.ts',
  'src/hooks/usePushNotifications.ts',
  'src/hooks/useRentalFilters.ts',
  'src/index.tsx',
  'src/lib/flags.ts',
  'src/main.tsx',
  'src/services/pushNotifications.ts',
  'src/utils/criticalResources.ts',
  'src/utils/emailParsingUtils.ts',
  'src/utils/enhancedPdfGenerator.ts',
  'src/utils/imageOptimization.ts',
  'src/utils/memoizeCallback.ts',
  'src/utils/pdfGenerator.ts',
  'src/utils/performance.ts',
  'src/utils/rentalFilters.ts',
  'src/utils/unifiedCacheSystem.ts',
  'src/utils/v2TestData.ts'
];

console.log('🔧 Opravujem ESLint chyby...');

// Opravy pre nepoužívané importy a premenné
const fixes = {
  // CacheMonitoring.tsx
  'src/components/admin/CacheMonitoring.tsx': [
    { from: 'import { useTheme }', to: '// import { useTheme }' },
    { from: 'const data = await response.json();', to: '// const data = await response.json();' }
  ],
  
  // VehicleOwnershipTransfer.tsx - už opravené
  
  // LoginForm.tsx - už opravené
  
  // ErrorBoundary.tsx
  'src/components/common/ErrorBoundary.tsx': [
    { from: 'errorInfo: any', to: 'errorInfo: ErrorInfo' },
    { from: 'const errorInfo = errorInfo;', to: '// const errorInfo = errorInfo;' }
  ],
  
  // ErrorToastContainer.tsx
  'src/components/common/ErrorToastContainer.tsx': [
    { from: 'WifiIcon,', to: '// WifiIcon,' },
    { from: 'const latestError = latestError;', to: '// const latestError = latestError;' }
  ],
  
  // InfiniteScrollContainer.tsx
  'src/components/common/InfiniteScrollContainer.tsx': [
    { from: 'Skeleton,', to: '// Skeleton,' },
    { from: 'items: any[]', to: 'items: unknown[]' },
    { from: 'onLoadMore: (page: number) => Promise<any>', to: 'onLoadMore: (page: number) => Promise<unknown>' }
  ],
  
  // LazyDetailView.tsx
  'src/components/common/LazyDetailView.tsx': [
    { from: 'data: any', to: 'data: unknown' },
    { from: 'onClose: (data?: any) => void', to: 'onClose: (data?: unknown) => void' },
    { from: 'onSave: (data: any) => Promise<void>', to: 'onSave: (data: unknown) => Promise<void>' }
  ],
  
  // LoadingStates.tsx
  'src/components/common/LoadingStates.tsx': [
    { from: 'const color = color;', to: '// const color = color;' },
    { from: 'props: any', to: 'props: Record<string, unknown>' }
  ],
  
  // NativeCamera.tsx
  'src/components/common/NativeCamera.tsx': [
    { from: 'error: any', to: 'error: Error' },
    { from: 'result: any', to: 'result: unknown' }
  ],
  
  // OfflineIndicator.tsx
  'src/components/common/OfflineIndicator.tsx': [
    { from: 'Fade,', to: '// Fade,' },
    { from: 'error: any', to: 'error: Error' },
    { from: 'event: any', to: 'event: Event' }
  ],
  
  // OptimizedImage.tsx
  'src/components/common/OptimizedImage.tsx': [
    { from: 'aspectRatio,', to: '// aspectRatio,' },
    { from: 'placeholder,', to: '// placeholder,' },
    { from: 'lazy,', to: '// lazy,' }
  ],
  
  // PDFViewer.tsx
  'src/components/common/PDFViewer.tsx': [
    { from: 'onError?: (error: any) => void', to: 'onError?: (error: Error) => void' }
  ],
  
  // PWAInstallPrompt.tsx
  'src/components/common/PWAInstallPrompt.tsx': [
    { from: 'StarIcon,', to: '// StarIcon,' },
    { from: 'Snackbar,', to: '// Snackbar,' },
    { from: 'Alert,', to: '// Alert,' }
  ],
  
  // PerformanceOptimizedList.tsx
  'src/components/common/PerformanceOptimizedList.tsx': [
    { from: 'items: any[]', to: 'items: unknown[]' },
    { from: 'const isMobile = isMobile;', to: '// const isMobile = isMobile;' },
    { from: 'onItemClick: (item: any) => void', to: 'onItemClick: (item: unknown) => void' }
  ],
  
  // PermissionGuard.tsx
  'src/components/common/PermissionGuard.tsx': [
    { from: 'error: any', to: 'error: Error' }
  ],
  
  // QuickFilters.tsx
  'src/components/common/QuickFilters.tsx': [
    { from: 'PopularIcon,', to: '// PopularIcon,' }
  ],
  
  // R2FileUpload.tsx
  'src/components/common/R2FileUpload.tsx': [
    { from: 'const showUploadedFiles = showUploadedFiles;', to: '// const showUploadedFiles = showUploadedFiles;' },
    { from: 'index: number', to: '_index: number' }
  ],
  
  // RealTimeNotifications.tsx
  'src/components/common/RealTimeNotifications.tsx': [
    { from: 'WarningIcon,', to: '// WarningIcon,' },
    { from: 'ErrorIcon,', to: '// ErrorIcon,' },
    { from: 'MenuItem,', to: '// MenuItem,' },
    { from: 'Paper,', to: '// Paper,' },
    { from: 'const getNotificationColor = getNotificationColor;', to: '// const getNotificationColor = getNotificationColor;' }
  ],
  
  // SuccessToast.tsx
  'src/components/common/SuccessToast.tsx': [
    { from: 'error: any', to: 'error: Error' }
  ]
};

// Aplikuj opravy
for (const [filePath, fileFixes] of Object.entries(fixes)) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const fix of fileFixes) {
      content = content.replace(fix.from, fix.to);
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Opravené: ${filePath}`);
  }
}

console.log('🎉 Opravy dokončené!');
