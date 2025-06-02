import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import LicenseModal from "@/components/LicenseModal";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import QuotationsList from "./pages/QuotationsList";
import QuotationForm from "./pages/QuotationForm";
import QuotationView from "./pages/QuotationView";
import Settings from "./pages/Settings";
import License from "./pages/License";
import Backup from "./pages/Backup";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const AppContent = () => {
  const { showLicenseModal, setShowLicenseModal } = useAuth();

  return (
    <>
      <LicenseModal 
        isOpen={showLicenseModal} 
        onClose={() => setShowLicenseModal(false)}
      />

      <Routes>
        {/* Public route - Auth page */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes - need authentication */}
        <Route path="/" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Index />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Products />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/quotations" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <QuotationsList />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/quotations/new" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <QuotationForm />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/quotations/:id" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <QuotationView />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Settings />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Add new Backup route */}
        <Route path="/backup" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <Backup />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/license" element={
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-grow">
                <License />
              </main>
              <footer className="bg-muted py-6 px-6 text-center text-sm">
                <p>
                  CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
                </p>
              </footer>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
