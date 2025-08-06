import './utils/dayjs-setup';
import './styles/custom-font.css'; // Aeonik font
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';

import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy imports pre code splitting a lepšie performance
import { Suspense, lazy } from 'react';

const VehicleList = lazy(() => import('./components/vehicles/VehicleListNew'));
const RentalList = lazy(() => import('./components/rentals/RentalListNew'));
const PendingRentalsManager = lazy(() => import('./components/rentals/PendingRentalsManager'));
const ImapEmailMonitoring = lazy(() => import('./components/admin/ImapEmailMonitoring'));
const EmailManagementDashboard = lazy(() => import('./components/admin/EmailManagementDashboard'));
const AuditLogsPage = lazy(() => import('./components/admin/AuditLogsPage'));
const CustomerList = lazy(() => import('./components/customers/CustomerListNew'));
const ExpenseList = lazy(() => import('./components/expenses/ExpenseListNew'));
const InsuranceList = lazy(() => import('./components/insurances/InsuranceList'));
const Statistics = lazy(() => import('./components/Statistics'));
const UserManagement = lazy(() => import('./components/users/UserManagementNew'));
const SettlementList = lazy(() => import('./components/settlements/SettlementListNew'));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPageNew'));
const VehicleOwnershipTransfer = lazy(() => import('./components/admin/VehicleOwnershipTransfer'));

// OPTIMALIZOVANÝ Loading component pre lazy loaded routes
const PageLoader = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '300px',
      flexDirection: 'column',
      gap: 2,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: 2,
      m: 2
    }}
  >
    <CircularProgress 
      size={50} 
      thickness={4}
      sx={{ 
        color: 'primary.main',
        '& .MuiCircularProgress-circle': {
          strokeLinecap: 'round',
        }
      }}
    />
    <Box sx={{ 
      color: 'text.secondary', 
      fontSize: '1rem',
      fontWeight: 500,
      textAlign: 'center'
    }}>
      ⚡ Načítavam stránku...
    </Box>
    <Box sx={{ 
      color: 'text.disabled', 
      fontSize: '0.75rem',
      textAlign: 'center'
    }}>
      Optimalizované načítanie
    </Box>
  </Box>
);

const AppContent: React.FC = () => {
  const { theme } = useThemeMode();
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
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
                          <ErrorBoundary>
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
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <RentalList />
                            </Suspense>
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/pending-rentals" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <PendingRentalsManager />
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
                    
                    <Route path="/audit-logs" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Layout>
                          <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                              <AuditLogsPage />
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
