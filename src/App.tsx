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
import BackupSettings from "./pages/BackupSettings"

const queryClient = new QueryClient()

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = Auth.getInstance();
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen w-full">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/delivery" element={<ProtectedRoute><Delivery /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute><Ingredients /></ProtectedRoute>} />
              <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/backups" element={<ProtectedRoute><BackupSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App
