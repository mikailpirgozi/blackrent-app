import './utils/dayjs-setup';
import './styles/custom-font.css'; // Aeonik font
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ErrorProvider } from './context/ErrorContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';

// Performance optimization imports
import { initializeWebVitalsOptimizations } from './utils/webVitalsOptimizations';
import { initializeCriticalResources } from './utils/criticalResources';
import { initializeMemoryOptimization } from './utils/memoryOptimizer';
import { initializeMobileOptimizations } from './utils/mobileOptimization';
import { initializeMobileStabilizer } from './utils/mobileStabilizer';
import { initializeMobilePerformance } from './utils/mobilePerformance';
import { initializeMobileLogger } from './utils/mobileLogger';

import ErrorBoundary from './components/common/ErrorBoundary';
import ErrorToastContainer from './components/common/ErrorToastContainer';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PWAStatus from './components/common/PWAStatus';
import OfflineIndicator from './components/common/OfflineIndicator';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { EnhancedLoading } from './components/common/EnhancedLoading';

// Lazy imports pre code splitting a lepšie performance
import { Suspense, lazy } from 'react';

const VehicleList = lazy(() => import('./components/vehicles/VehicleListNew'));
const RentalList = lazy(() => import('./components/rentals/RentalListNew'));
const ImapEmailMonitoring = lazy(() => import('./components/admin/ImapEmailMonitoring'));
const EmailManagementDashboard = lazy(() => import('./components/admin/EmailManagementDashboard'));
const CustomerList = lazy(() => import('./components/customers/CustomerListNew'));
const ExpenseList = lazy(() => import('./components/expenses/ExpenseListNew'));
const InsuranceList = lazy(() => import('./components/insurances/InsuranceList'));
const Statistics = lazy(() => import('./components/Statistics'));
const UserManagement = lazy(() => import('./components/users/IntegratedUserManagement'));
const SettlementList = lazy(() => import('./components/settlements/SettlementListNew'));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPageNew'));
const VehicleOwnershipTransfer = lazy(() => import('./components/admin/VehicleOwnershipTransfer'));

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
    // Initialize all performance optimizations
    initializeCriticalResources();
    initializeWebVitalsOptimizations();
    initializeMemoryOptimization();
    initializeMobileOptimizations();

    // Initialize mobile stabilizer for preventing unexpected refreshes
    initializeMobileStabilizer({
      enablePreventUnload: true,
      enableMemoryMonitoring: false, // Disable heavy monitoring in global scope
      enableVisibilityHandling: true,
      enableFormDataPersistence: false, // Only enable in specific forms
      debugMode: false // Disable verbose logging for better performance
    });

    // Initialize mobile performance optimizations
    initializeMobilePerformance({
      enableVirtualization: true,
      enableImageOptimization: true,
      enableRenderOptimization: true,
      debugMode: false
    });

    // Initialize mobile logger for detailed diagnostics
    const mobileLogger = initializeMobileLogger();
    mobileLogger.log('INFO', 'App', 'BlackRent application starting', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // 🚨 NETWORK MONITORING: Track all API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || 'unknown';
      console.log('🌐 MOBILE DEBUG: API CALL STARTED:', url);
      
      try {
        const response = await originalFetch(...args);
        console.log('✅ MOBILE DEBUG: API CALL SUCCESS:', url, response.status);
        
        // Check if this API call might affect modal state
        if (url.includes('protocol') || url.includes('rental')) {
          console.log('⚠️ MOBILE DEBUG: PROTOCOL/RENTAL API CALL - might affect modal!');
          alert(`🌐 API CALL: ${url} - status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        console.log('❌ MOBILE DEBUG: API CALL ERROR:', url, error);
        alert(`❌ API ERROR: ${url} - ${error}`);
        throw error;
      }
    };

    // 🚨 WEBSOCKET MONITORING: Track WebSocket messages
    const originalWebSocket = window.WebSocket;
    window.WebSocket = class extends WebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        console.log('🔌 MOBILE DEBUG: WebSocket CREATED:', url);
        
        this.addEventListener('message', (event) => {
          console.log('📨 MOBILE DEBUG: WebSocket MESSAGE:', event.data);
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'rental_update' || data.type === 'protocol_update') {
              console.log('⚠️ MOBILE DEBUG: CRITICAL WebSocket message - might close modal!');
              alert(`📨 WebSocket: ${data.type} - might affect modal!`);
            }
          } catch (e) {
            // Not JSON, ignore
          }
        });
        
        this.addEventListener('close', (event) => {
          console.log('🔌 MOBILE DEBUG: WebSocket CLOSED:', event.code, event.reason);
          alert(`🔌 WebSocket CLOSED: ${event.code} - ${event.reason}`);
        });
      }
    };

    // 🚨 STORAGE MONITORING: Track localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      console.log('💾 MOBILE DEBUG: localStorage SET:', key, value);
      if (key.includes('modal') || key.includes('protocol')) {
        alert(`💾 localStorage: ${key} = ${value}`);
      }
      return originalSetItem.call(this, key, value);
    };

    // 🚨 PAGE RELOAD DETECTION
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      console.log('🔄 MOBILE DEBUG: Navigation type:', navEntry.type);
      console.log('🔄 MOBILE DEBUG: Reload count since startup:', window.history.length);
      
      if (navEntry.type === 'reload') {
        alert(`🔄 PAGE RELOAD DETECTED! Type: ${navEntry.type}`);
      } else if (navEntry.type === 'navigate') {
        alert(`🔄 PAGE NAVIGATION DETECTED! Type: ${navEntry.type}`);
      }
    }

    // Check if page was reloaded recently
    const lastReload = sessionStorage.getItem('lastReload');
    const now = Date.now();
    if (lastReload) {
      const timeSinceReload = now - parseInt(lastReload);
      if (timeSinceReload < 5000) { // Less than 5 seconds
        alert(`⚠️ RECENT RELOAD: ${timeSinceReload}ms ago!`);
      }
    }
    sessionStorage.setItem('lastReload', now.toString());

    // Track page visibility changes that might cause reloads
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('📱 MOBILE DEBUG: Page became HIDDEN');
        sessionStorage.setItem('pageHidden', Date.now().toString());
      } else {
        console.log('📱 MOBILE DEBUG: Page became VISIBLE');
        const hiddenTime = sessionStorage.getItem('pageHidden');
        if (hiddenTime) {
          const hiddenDuration = Date.now() - parseInt(hiddenTime);
          console.log('📱 MOBILE DEBUG: Was hidden for:', hiddenDuration, 'ms');
          if (hiddenDuration > 1000) {
            alert(`📱 PAGE WAS HIDDEN: ${hiddenDuration}ms - might cause reload!`);
          }
        }
      }
    });

    // 🚨 URL NAVIGATION TRACKING
    let lastUrl = window.location.href;
    console.log('🔗 MOBILE DEBUG: Initial URL:', lastUrl);
    
    // Track hash changes
    window.addEventListener('hashchange', (event) => {
      console.log('🔗 MOBILE DEBUG: Hash changed!');
      console.log('🔗 MOBILE DEBUG: From:', event.oldURL);
      console.log('🔗 MOBILE DEBUG: To:', event.newURL);
      alert(`🔗 HASH CHANGE: ${event.oldURL} → ${event.newURL}`);
    });
    
    // Track popstate (back/forward navigation)
    window.addEventListener('popstate', (event) => {
      console.log('🔗 MOBILE DEBUG: PopState navigation!');
      console.log('🔗 MOBILE DEBUG: State:', event.state);
      console.log('🔗 MOBILE DEBUG: URL:', window.location.href);
      alert(`🔗 POPSTATE: Navigated to ${window.location.href}`);
    });
    
    // Track URL changes via polling (catches programmatic navigation)
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('🔗 MOBILE DEBUG: URL changed programmatically!');
        console.log('🔗 MOBILE DEBUG: From:', lastUrl);
        console.log('🔗 MOBILE DEBUG: To:', currentUrl);
        alert(`🔗 URL CHANGE: ${lastUrl} → ${currentUrl}`);
        lastUrl = currentUrl;
      }
    };
    
    // Check URL every 500ms
    const urlChecker = setInterval(checkUrlChange, 500);
    
    // Store interval ID for cleanup
    (window as any).urlChecker = urlChecker;

    console.log('⚡ Performance & Mobile optimizations initialized');
    console.log('🛡️ Mobile stabilizer initialized globally');
    console.log('📱 Mobile logger initialized for diagnostics');
    console.log('🚨 MOBILE DEBUG: All monitoring systems active!');
    alert('🚨 MONITORING ACTIVE: API, WebSocket, localStorage tracked!');
  }, []);
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorProvider>
        <ErrorToastContainer />
        {/* PWA Install moved to sidebar - no auto-popup */}
        <OfflineIndicator position="top" showDetails={true} />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <PermissionsProvider>
              <AppProvider>
            <Router>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Routes>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout>
                          <Navigate to="/vehicles" replace />
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
