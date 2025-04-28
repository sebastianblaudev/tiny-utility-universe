import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Auth } from "@/lib/auth"
import LoginPage from "./pages/Login"
import Index from "./pages/Index"
import Products from "./pages/Products"
import Customers from "./pages/Customers"
import History from "./pages/History"
import NotFound from "./pages/NotFound"
import Ingredients from "./pages/Ingredients"
import Shifts from "./pages/Shifts"
import Delivery from "./pages/Delivery"
import Reports from "./pages/Reports"
import Categories from "./pages/Categories"
import Settings from "./pages/Settings"
import Respaldos from "./pages/Respaldos"
import { useEffect, useState } from "react"
import { initDB } from "@/lib/db"
import BusinessWizard from "@/components/auth/BusinessWizard"
import ActivateLicense from "./pages/ActivateLicense"

const queryClient = new QueryClient()

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const auth = Auth.getInstance();
  
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !auth.isAdmin()) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const CashierRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = Auth.getInstance();
  
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  
  useEffect(() => {
    const checkBusinessSetup = async () => {
      try {
        const db = await initDB();
        const businessData = await db.getAll('business');
        setNeedsSetup(businessData.length === 0);
      } catch (error) {
        console.error('Error checking business setup:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkBusinessSetup();
  }, []);

  useEffect(() => {
    const initDefaultAdmin = async () => {
      const auth = Auth.getInstance();
      if (auth.getAllUsers().length === 0) {
        try {
          await auth.register("admin", "admin123", "admin");
          console.log("Usuario administrador por defecto creado");
        } catch (error) {
          console.error("Error al crear usuario por defecto:", error);
        }
      }
    };
    
    initDefaultAdmin();
  }, []);
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen w-full">
            <Routes>
              <Route
                path="/setup"
                element={<BusinessWizard />}
              />
              <Route 
                path="/login" 
                element={<LoginPage />} 
              />
              <Route
                path="/activar-licencia"
                element={<ActivateLicense />}
              />
              <Route path="/" element={<CashierRoute><Index /></CashierRoute>} />
              <Route path="/delivery" element={<ProtectedRoute adminOnly={true}><Delivery /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute adminOnly={true}><Products /></ProtectedRoute>} />
              <Route path="/customers" element={<CashierRoute><Customers /></CashierRoute>} />
              <Route path="/history" element={<ProtectedRoute adminOnly={true}><History /></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute adminOnly={true}><Ingredients /></ProtectedRoute>} />
              <Route path="/shifts" element={<CashierRoute><Shifts /></CashierRoute>} />
              <Route path="/reports" element={<ProtectedRoute adminOnly={true}><Reports /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute adminOnly={true}><Categories /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute adminOnly={true}><Settings /></ProtectedRoute>} />
              <Route path="/backups" element={<ProtectedRoute adminOnly={true}><Respaldos /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
