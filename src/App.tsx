
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Products from "./pages/Products";
import QuotationsList from "./pages/QuotationsList";
import QuotationForm from "./pages/QuotationForm";
import QuotationView from "./pages/QuotationView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/quotations/new" element={<QuotationForm />} />
              <Route path="/quotations/:id" element={<QuotationView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-muted py-6 px-6 text-center text-sm">
            <p>
              CotiPro Chile &copy; {new Date().getFullYear()} - Sistema de cotizaciones profesionales
            </p>
          </footer>
        </div>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
