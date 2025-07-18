import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/Layout';
import VehicleList from './components/vehicles/VehicleList';
import RentalList from './components/rentals/RentalList';
import CustomerList from './components/customers/CustomerList';
import ExpenseList from './components/expenses/ExpenseList';
import InsuranceList from './components/insurances/InsuranceList';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Statistics from './components/Statistics';
import SettlementList from './components/settlements/SettlementList';
import UserManagement from './components/users/UserManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout currentPage="Dashboard">
                    <Navigate to="/rentals" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/vehicles" element={
                <ProtectedRoute requiredPermission={{ resource: 'vehicles', action: 'read' }}>
                  <Layout currentPage="Vozidlá">
                    <VehicleList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/rentals" element={
                <ProtectedRoute requiredPermission={{ resource: 'rentals', action: 'read' }}>
                  <Layout currentPage="Prenájmy">
                    <RentalList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute requiredPermission={{ resource: 'customers', action: 'read' }}>
                  <Layout currentPage="Zákazníci">
                    <CustomerList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute requiredPermission={{ resource: 'expenses', action: 'read' }}>
                  <Layout currentPage="Náklady">
                    <ExpenseList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/insurances" element={
                <ProtectedRoute requiredPermission={{ resource: 'insurances', action: 'read' }}>
                  <Layout currentPage="Poistky">
                    <InsuranceList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/settlements" element={
                <ProtectedRoute requiredPermission={{ resource: 'settlements', action: 'read' }}>
                  <Layout currentPage="Vyúčtovanie">
                    <SettlementList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/statistics" element={
                <ProtectedRoute requiredPermission={{ resource: 'statistics', action: 'read' }}>
                  <Layout currentPage="Štatistiky">
                    <Statistics />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
                  <Layout currentPage="Používatelia">
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
