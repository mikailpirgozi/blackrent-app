import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';

import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import VehicleList from './components/vehicles/VehicleList';
import RentalList from './components/rentals/RentalList';
import CustomerList from './components/customers/CustomerList';
import ExpenseList from './components/expenses/ExpenseList';
import SettlementList from './components/settlements/SettlementList';
import InsuranceList from './components/insurances/InsuranceList';
import UserManagement from './components/users/UserManagement';
import Statistics from './components/Statistics';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
        <AuthProvider>
          <AppProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Navigate to="/rentals" replace />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/vehicles" element={
                  <ProtectedRoute requiredPermission={{ resource: 'vehicles', action: 'read' }}>
                    <Layout>
                      <VehicleList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/rentals" element={
                  <ProtectedRoute requiredPermission={{ resource: 'rentals', action: 'read' }}>
                    <Layout>
                      <RentalList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/customers" element={
                  <ProtectedRoute requiredPermission={{ resource: 'customers', action: 'read' }}>
                    <Layout>
                      <CustomerList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/expenses" element={
                  <ProtectedRoute requiredPermission={{ resource: 'expenses', action: 'read' }}>
                    <Layout>
                      <ExpenseList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settlements" element={
                  <ProtectedRoute requiredPermission={{ resource: 'settlements', action: 'read' }}>
                    <Layout>
                      <SettlementList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/insurances" element={
                  <ProtectedRoute requiredPermission={{ resource: 'insurances', action: 'read' }}>
                    <Layout>
                      <InsuranceList />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/statistics" element={
                  <ProtectedRoute requiredPermission={{ resource: 'statistics', action: 'read' }}>
                    <Layout>
                      <Statistics />
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </AppProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
