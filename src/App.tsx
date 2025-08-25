import React, { Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";

import Productos from "./pages/Productos";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import POS from "./pages/POS";
import Configuracion from "./pages/Configuracion";
import Estadisticas from "./pages/Estadisticas";
import CustomerDisplay2 from "./pages/CustomerDisplay2";
import { AnimationProvider } from './contexts/AnimationContext';
import { LicenseProvider } from './contexts/LicenseContext';
import { LoadingIndicator } from '@/components/ui/skeleton';
import OfflineIndicator from '@/components/OfflineIndicator';
import Customers2 from './pages/Customers2';
import VideoTutoriales from "./pages/VideoTutoriales";
import Turnos from "./pages/Turnos";
import MobileDashboard from "./pages/MobileDashboard";
import OwnerControl from "./pages/OwnerControl";
import Eagle from "./pages/Eagle";
import WeightSaleTest from "./components/WeightSaleTest";
import Massive from "./pages/Massive";

import HistorialVentas2 from "./pages/HistorialVentas2";

const SaleDetails = React.lazy(() => import("./pages/SaleDetails"));

const queryClient = new QueryClient();

function App() {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ThemeProvider>
          <AuthProvider>
            <LicenseProvider>
              <CartProvider>
                <AnimationProvider>
                  <OfflineIndicator />
                  <Toaster />
                  <Routes>
                 <Route path="/login" element={<Login />} />
                 <Route path="/register" element={<Register />} />
                 <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
                 <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route
                  path="/mobile-dashboard"
                  element={
                    <ProtectedRoute>
                      <MobileDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/dashboard" element={<Navigate to="/pos" replace />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <Productos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/customers2" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers2"
                  element={
                    <ProtectedRoute>
                      <Customers2 />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/historial-ventas" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/historial-ventas"
                  element={
                    <ProtectedRoute>
                      <HistorialVentas2 />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caja"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/turnos" replace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caja2"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/turnos" replace />
                    </ProtectedRoute>
                  }
                />
                 <Route
                   path="/turnos"
                   element={
                     <ProtectedRoute>
                       <Turnos />
                     </ProtectedRoute>
                   }
                 />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <POS />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracion"
                  element={
                    <ProtectedRoute>
                      <Configuracion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estadisticas"
                  element={
                    <ProtectedRoute>
                      <Estadisticas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-tutoriales"
                  element={
                    <ProtectedRoute>
                      <VideoTutoriales />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sale-details"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Cargando detalles de venta...</div>}>
                        <SaleDetails />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route path="/pantalla2" element={<CustomerDisplay2 />} />
                <Route
                  path="/owner-control"
                  element={
                    <ProtectedRoute>
                      <OwnerControl />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/eagle"
                  element={
                    <ProtectedRoute>
                      <Eagle />
                    </ProtectedRoute>
                  }
                />
                 <Route
                   path="/test-peso"
                   element={
                     <ProtectedRoute>
                       <WeightSaleTest />
                     </ProtectedRoute>
                   }
                 />
                 <Route
                   path="/massive"
                   element={
                     <ProtectedRoute>
                       <Massive />
                     </ProtectedRoute>
                   }
                 />
                 <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimationProvider>
              </CartProvider>
            </LicenseProvider>
          </AuthProvider>
        </ThemeProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
