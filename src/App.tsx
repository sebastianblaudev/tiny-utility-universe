
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import History from "./pages/History";
import Ingredients from "./pages/Ingredients";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Shifts from "./pages/Shifts";
import Reports from "./pages/Reports";
import Respaldos from "./pages/Respaldos";
import OnlineBackup from "./pages/OnlineBackup";
import Login from "./pages/Login";
import AccountDisabled from "./pages/AccountDisabled";
import ActivateLicense from "./pages/ActivateLicense";
import Sync from "./pages/Sync"; // Importación correcta del componente Sync
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

import "./App.css";

// Use lazy loading for non-critical routes to speed up initial load
const LazySettings = lazy(() => import("./pages/Settings"));
const LazyDelivery = lazy(() => import("./pages/Delivery"));
const LazyDeliveryTracking = lazy(() => import("./pages/DeliveryTracking"));
const LazyStorageTest = lazy(() => import("./pages/SupabaseStorageTest"));
const LazyAdminStats = lazy(() => import("./pages/AdminStats"));
const LazyPCloudStats = lazy(() => import("./pages/PCloudStats"));
const LazyMonitor = lazy(() => import("./pages/Monitor"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/account-disabled" element={<AccountDisabled />} />
            <Route path="/activate" element={<ActivateLicense />} />
            
            {/* Protected Routes - Critical Paths */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
            <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/backups" element={<ProtectedRoute><Respaldos /></ProtectedRoute>} />
            <Route path="/online-backup" element={<ProtectedRoute><OnlineBackup /></ProtectedRoute>} />
            <Route path="/sync" element={<ProtectedRoute><Sync /></ProtectedRoute>} />
            
            {/* Nueva ruta para el Monitor de Ventas */}
            <Route path="/monitor" element={
              <Suspense fallback={<div className="p-8">Cargando monitor...</div>}>
                <LazyMonitor />
              </Suspense>
            } />
            
            {/* Protected Routes - Non-Critical (Lazy Loaded) */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando configuración...</div>}>
                  <LazySettings />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/delivery" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando...</div>}>
                  <LazyDelivery />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/delivery-tracking" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando seguimiento...</div>}>
                  <LazyDeliveryTracking />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/local-storage" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando...</div>}>
                  <LazyStorageTest />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/admin-stats" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando estadísticas...</div>}>
                  <LazyAdminStats />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/pcloud-stats" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="p-8">Cargando estadísticas...</div>}>
                  <LazyPCloudStats />
                </Suspense>
              </ProtectedRoute>
            } />
            
            {/* Default route - Not Found page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        <Toaster />
        <SonnerToaster position="top-right" closeButton expand={false} />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
