
import React, { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import PageTransition from '@/components/animations/PageTransition';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBackButton }) => {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Efecto de desplazamiento suave al inicio de la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <PageTransition>
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-background ${isMobile ? 'mobile-main' : ''}`}
        >
          {children}
          <Toaster />
        </main>
      </PageTransition>
    </div>
  );
};

export default Layout;
