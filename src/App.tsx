import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import theme from './theme/theme';

import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Importy stránok
import VehicleList from './components/vehicles/VehicleList';
import RentalList from './components/rentals/RentalList';
import CustomerList from './components/customers/CustomerList';
import ExpenseList from './components/expenses/ExpenseList';
import InsuranceList from './components/insurances/InsuranceList';
import Statistics from './components/Statistics';
import UserManagement from './components/users/UserManagement';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
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
                            <VehicleList />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/rentals" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <RentalList />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/customers" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <CustomerList />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/expenses" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <ExpenseList />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/insurances" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <InsuranceList />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/statistics" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <Statistics />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/users" element={
                      <ProtectedRoute>
                        <Layout>
                          <ErrorBoundary>
                            <UserManagement />
                          </ErrorBoundary>
                        </Layout>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Box>
              </Router>
            </AppProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
