
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { BarberProvider } from "./contexts/BarberContext";
import { FinancialProvider } from "./contexts/FinancialContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import POSPage from "./pages/POSPage";
import NotFound from "./pages/NotFound";
import UsersPage from "./pages/UsersPage";
import ServicesPage from "./pages/ServicesPage";
import AdvancesPage from "./pages/AdvancesPage";
import ReportsPage from "./pages/ReportsPage";
import HostingReportsPage from "./pages/HostingReportsPage";
import CommissionsPage from "./pages/CommissionsPage";
import ExpensesPage from "./pages/ExpensesPage";
import FinancialReportsPage from "./pages/FinancialReportsPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuth } from "./contexts/AuthContext";
import React from "react";

// Componente de protección de rutas
const PrivateRoute = ({ 
  children, 
  requireAdmin = false, 
  requireOwner = false 
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean, 
  requireOwner?: boolean 
}) => {
  const { currentUser, isAdmin, isOwner } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireOwner && !isOwner) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/pos" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <POSPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/users" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <UsersPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/services" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <ServicesPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/advances" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <AdvancesPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/reports" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <ReportsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/hosting-reports" element={
        <PrivateRoute requireAdmin={true}>
          <HostingReportsPage />
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <SettingsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/commissions" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <CommissionsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/expenses" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <ExpensesPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/financial-reports" element={
        <PrivateRoute requireAdmin={true}>
          <Layout requireAdmin={true}>
            <FinancialReportsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <AuthProvider>
            <BarberProvider>
              <FinancialProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <AppRoutes />
                </TooltipProvider>
              </FinancialProvider>
            </BarberProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
