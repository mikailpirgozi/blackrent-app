// MUI imports removed - using shadcn/ui theme system
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { Suspense, lazy } from 'react';
import { queryClient } from './lib/react-query/queryClient';
import { useWebSocketInvalidation } from './lib/react-query/websocket-integration';
import './styles/custom-font.css'; // Aeonik font

// shadcn/ui providers
import { TooltipProvider } from '@/components/ui/tooltip';

// Performance optimization imports - removed unused imports

import LoginForm from './components/auth/LoginForm';
import ErrorBoundary from './components/common/ErrorBoundary';
import ErrorToastContainer from './components/common/ErrorToastContainer';
// PWA components removed - not used
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { EnhancedLoading } from './components/common/EnhancedLoading';
import OfflineIndicator from './components/common/OfflineIndicator';

// Lazy imports pre code splitting a lepšie performance
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ThemeProvider } from './context/ThemeContext';
// import { initializeCriticalResources } from './utils/criticalResources'; // REMOVED: Replaced with fast startup
import { optimizedStartup } from './utils/fastStartup';
import { logger } from './utils/smartLogger';
import { crashDetector } from './utils/monitoring/CrashDetector';
import { indexedDBManager } from './utils/storage/IndexedDBManager';

const PremiumDashboard = lazy(
  () => import('./components/dashboard/PremiumDashboard')
);
const VehicleList = lazy(() => import('./components/vehicles/VehicleListNew'));
const RentalList = lazy(() => import('./components/rentals/RentalList'));
const EmailManagementDashboard = lazy(
  () => import('./components/email-management/EmailManagementLayout')
);
const R2FileManager = lazy(() => import('./components/admin/R2FileManager'));

const CustomerList = lazy(
  () => import('./components/customers/CustomerListNew')
);
const ExpenseList = lazy(() => import('./components/expenses/ExpenseListNew'));
import InsuranceList from './components/insurances/InsuranceList';
const Statistics = lazy(() => import('./components/Statistics'));
const UserManagement = lazy(() => import('./pages/UserManagementPage'));

const SettlementList = lazy(
  () => import('./components/settlements/SettlementListNew')
);
const SmartAvailabilityPage = lazy(
  () => import('./pages/SmartAvailabilityPage')
);
const LeasingList = lazy(() => import('./components/leasings/LeasingList'));
const PermissionManagementPage = lazy(
  () => import('./pages/PermissionManagementPage')
);
const PlatformManagementPage = lazy(
  () => import('./pages/PlatformManagementPage')
);

// 🧪 TEST PAGE: Removed - TestProtocolPhotos (old photo system)

// OPTIMALIZOVANÝ Loading component pre lazy loaded routes
const PageLoader = () => (
  <EnhancedLoading
    variant="page"
    message="⚡ Načítavam stránku..."
    showMessage={true}
  />
);

// WebSocket Integration Wrapper - musí byť vnútri QueryClientProvider
const WebSocketIntegrationWrapper: React.FC = () => {
  useWebSocketInvalidation();
  return null;
};

const AppContent: React.FC = () => {
  // ⚡ FAST STARTUP: Optimized initialization + Enterprise PWA
  React.useEffect(() => {
    logger.info(
      '🚀 Starting optimized app initialization...',
      undefined,
      'performance'
    );

    try {
      // Run optimized parallel startup (< 1s)
      optimizedStartup();

      // Initialize Enterprise PWA systems
      Promise.all([indexedDBManager.init(), crashDetector.initialize()])
        .then(() => {
          logger.info('✅ Enterprise PWA systems initialized');
        })
        .catch(error => {
          logger.error('❌ PWA initialization failed', error);
        });
    } catch (error) {
      logger.error('❌ Optimized startup failed', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ErrorToastContainer />
            {/* PWA Install moved to sidebar - no auto-popup */}
            <OfflineIndicator position="top" showDetails={true} />
            <AuthProvider>
              <PermissionsProvider>
                <AppProvider>
                  <WebSocketIntegrationWrapper />
                  <Router
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <div className="flex flex-col min-h-screen">
                      <Routes>
                        <Route path="/login" element={<LoginForm />} />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary level="page" maxRetries={3}>
                                  <Suspense fallback={<PageLoader />}>
                                    <PremiumDashboard />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary level="page" maxRetries={3}>
                                  <Suspense fallback={<PageLoader />}>
                                    <PremiumDashboard />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        {/* Hlavné stránky s ErrorBoundary */}
                        <Route
                          path="/vehicles"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary level="page" maxRetries={3}>
                                  <Suspense fallback={<PageLoader />}>
                                    <VehicleList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/rentals"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary level="page" maxRetries={3}>
                                  <Suspense fallback={<PageLoader />}>
                                    <RentalList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/email-monitoring"
                          element={
                            <ProtectedRoute
                              allowedRoles={['admin', 'super_admin']}
                              allowedPlatformIds={[
                                '56d0d727-f725-47be-9508-d988ecfc0705',
                              ]}
                            >
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <EmailManagementDashboard />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/customers"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <CustomerList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/expenses"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <ExpenseList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/insurances"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <InsuranceList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/leasings"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <LeasingList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/settlements"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <SettlementList />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/statistics"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <Statistics />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/users"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <UserManagement />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        {/* 🌐 PLATFORM MANAGEMENT - Super Admin Only */}
                        <Route
                          path="/platforms"
                          element={
                            <ProtectedRoute
                              allowedRoles={['super_admin', 'admin']}
                            >
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <PlatformManagementPage />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        {/* 🧪 TEST ROUTE: Removed - old photo system */}

                        {/* NEW SMART AVAILABILITY - Optimized replacement */}
                        <Route
                          path="/availability"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <SmartAvailabilityPage />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/availability-smart"
                          element={
                            <ProtectedRoute>
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <SmartAvailabilityPage />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/admin/permissions"
                          element={
                            <ProtectedRoute
                              allowedRoles={['admin', 'super_admin']}
                            >
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <PermissionManagementPage />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />

                        <Route
                          path="/admin/r2-files"
                          element={
                            <ProtectedRoute
                              allowedRoles={['admin', 'super_admin']}
                            >
                              <Layout>
                                <ErrorBoundary>
                                  <Suspense fallback={<PageLoader />}>
                                    <R2FileManager />
                                  </Suspense>
                                </ErrorBoundary>
                              </Layout>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </div>
                  </Router>
                </AppProvider>
              </PermissionsProvider>
            </AuthProvider>
            {/* React Query DevTools - len v development */}
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorProvider>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
