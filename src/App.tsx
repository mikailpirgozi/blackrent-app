import './styles/custom-font.css'; // Aeonik font
import React from 'react';
import { logger } from './utils/smartLogger';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ErrorProvider } from './context/ErrorContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';

// Performance optimization imports
// import { initializeWebVitalsOptimizations } from './utils/webVitalsOptimizations';
import { initializeCriticalResources } from './utils/criticalResources';
// import { initializeMemoryOptimization } from './utils/memoryOptimizer';
// import { initializeMobileOptimizations } from './utils/mobileOptimization';
// import { initializeMobileStabilizer } from './utils/mobileStabilizer';
// import { initializeMobilePerformance } from './utils/mobilePerformance';
// 🔄 MOBILE CLEANUP: mobileLogger removed
// import { initializeMobileLogger } from './utils/mobileLogger';

import ErrorBoundary from './components/common/ErrorBoundary';
import ErrorToastContainer from './components/common/ErrorToastContainer';
// import PWAInstallPrompt from './components/common/PWAInstallPrompt';
// import PWAStatus from './components/common/PWAStatus';
import OfflineIndicator from './components/common/OfflineIndicator';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { EnhancedLoading } from './components/common/EnhancedLoading';

// Lazy imports pre code splitting a lepšie performance
import { Suspense, lazy } from 'react';

const VehicleList = lazy(() => import('./components/vehicles/VehicleListNew'));
const RentalList = lazy(() => import('./components/rentals/RentalList'));
// const ImapEmailMonitoring = lazy(() => import('./components/admin/ImapEmailMonitoring'));
const EmailManagementDashboard = lazy(() => import('./components/email-management/EmailManagementLayout'));

const CustomerList = lazy(() => import('./components/customers/CustomerListNew'));
const ExpenseList = lazy(() => import('./components/expenses/ExpenseListNew'));
const InsuranceList = lazy(() => import('./components/insurances/InsuranceList'));
const Statistics = lazy(() => import('./components/Statistics'));
const UserManagement = lazy(() => import('./components/users/IntegratedUserManagement'));

const SettlementList = lazy(() => import('./components/settlements/SettlementListNew'));
// OLD: const AvailabilityPage = lazy(() => import('./pages/AvailabilityPageNew')); // REMOVED - replaced by Smart version
const SmartAvailabilityPage = lazy(() => import('./pages/SmartAvailabilityPage'));


// OPTIMALIZOVANÝ Loading component pre lazy loaded routes
const PageLoader = () => (
  <EnhancedLoading 
    variant="page" 
    message="⚡ Načítavam stránku..." 
    showMessage={true}
  />
);

const AppContent: React.FC = () => {
  const { theme } = useThemeMode();
  
  // Initialize performance optimizations
  React.useEffect(() => {
    // Initialize critical resources only
    logger.info('Initializing critical resources...', undefined, 'performance');
    
    try {
      initializeCriticalResources();
      logger.info('Critical resources initialized successfully', undefined, 'performance');
    } catch (error) {
      logger.error('Critical resources initialization failed', error);
    }
  }, []);
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorProvider>
        <ErrorToastContainer />
        {/* PWA Install moved to sidebar - no auto-popup */}
        <OfflineIndicator position="top" showDetails={true} />
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
          <AuthProvider>
            <PermissionsProvider>
              <AppProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout>
                          <Navigate to="/rentals" replace />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Hlavné stránky s ErrorBoundary */}
                    <Route path="/vehicles" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary level="page" maxRetries={3}>
                            <Suspense fallback={<PageLoader />}>
                              <VehicleList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/rentals" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary level="page" maxRetries={3}>
                            <Suspense fallback={<PageLoader />}>
                              <RentalList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    

                    <Route path="/email-monitoring" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <EmailManagementDashboard />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    


                    <Route path="/customers" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <CustomerList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/expenses" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <ExpenseList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/insurances" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <InsuranceList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/settlements" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <SettlementList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/statistics" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <Statistics />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/users" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <UserManagement />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    

                    
                    {/* OLD AVAILABILITY - REMOVED (was memory monster with 28,997 DOM elements)
                    <Route path="/availability" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <AvailabilityPage />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } /> */}
                    
                    {/* NEW SMART AVAILABILITY - Optimized replacement */}
                    <Route path="/availability" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <SmartAvailabilityPage />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/availability-smart" element={
                      <ProtectedRoute>
                        <ErrorBoundary>
                          <Suspense fallback={<PageLoader />}>
                            <SmartAvailabilityPage />
                          </Suspense>
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } />
                    
                    {/* DEAKTIVOVANÉ - Transfer vlastníctva sa nepoužíva */}
                    {/* <Route path="/admin/vehicle-ownership" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <VehicleOwnershipTransfer />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } /> */}
                  </Routes>
                </Box>
              </Router>
              </AppProvider>
            </PermissionsProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ErrorProvider>
    </MuiThemeProvider>
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
