
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Auth from './pages/Auth';
import Index from './pages/Index';
import Products from './pages/Products';
import QuotationsList from './pages/QuotationsList';
import QuotationView from './pages/QuotationView';
import QuotationForm from './pages/QuotationForm';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import License from './pages/License';
import NotFound from './pages/NotFound';
import QuotationEdit from './pages/QuotationEdit';

import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthProvider';
import LicenseModal from './components/LicenseModal';
import InstallPWA from './components/InstallPWA';

function App() {
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-chile-blue/5 via-white to-chile-red/5">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <Index />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <Products />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/quotations" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <QuotationsList />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/quotations/new" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <QuotationForm />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/quotations/edit/:id" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <QuotationEdit />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/quotations/:id" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <QuotationView />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <Settings />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/backup" element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-1">
                        <Backup />
                      </main>
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/license" element={<License />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <LicenseModal 
                isOpen={isLicenseModalOpen} 
                onClose={() => setIsLicenseModalOpen(false)} 
              />
              <InstallPWA />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </div>
    </QueryClientProvider>
  );
}

export default App;
