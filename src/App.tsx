import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Dashboard2 from "./pages/Dashboard2";
import Productos from "./pages/Productos";
import Customers from "./pages/Customers";
import HistorialVentas from "./pages/HistorialVentas";
import HistorialVentas2 from "./pages/HistorialVentas2";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Caja from "./pages/Caja";
import Caja2 from "./pages/Caja2";
import POS from "./pages/POS";
import Configuracion from "./pages/Configuracion";
import Estadisticas from "./pages/Estadisticas";
import CustomerDisplay2 from "./pages/CustomerDisplay2";
import Customers2 from './pages/Customers2';
import VideoTutoriales from "./pages/VideoTutoriales";
import CajaEstadisticas from "./pages/CajaEstadisticas";
import Turnos from "./pages/Turnos";
import Gestion from "./pages/Gestion";
import Test from "./pages/Test";
import MobileDashboard from "./pages/MobileDashboard";

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
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Index />} />
                <Route
                  path="/mobile-dashboard"
                  element={
                    <ProtectedRoute>
                      <MobileDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard2"
                  element={
                    <ProtectedRoute>
                      <Dashboard2 />
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
                      <HistorialVentas />
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
                  path="/gestion"
                  element={
                    <ProtectedRoute>
                      <Gestion />
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
                <Route path="/caja-estadisticas" element={<ProtectedRoute><CajaEstadisticas /></ProtectedRoute>} />
                <Route path="/test" element={<ProtectedRoute><Test /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
