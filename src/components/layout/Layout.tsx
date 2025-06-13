
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLicenseValidation } from '@/hooks/useLicenseValidation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import LicenseActivationModal from '@/components/license/LicenseActivationModal';

interface LayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOwner?: boolean;
}

const Layout = ({ children, requireAdmin = false, requireOwner = false }: LayoutProps) => {
  const { currentUser, isAdmin, isOwner } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hook para validación de licencia
  const { isLicenseValid, isChecking, validateLicense } = useLicenseValidation();
  
  // Check if the current route requires specific access
  useEffect(() => {
    const adminOnlyRoutes = ['/services', '/advances', '/reports', '/settings', '/pos', '/users'];
    const ownerOnlyRoutes: string[] = [];
    
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (requireOwner && !isOwner) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    if (!isOwner && ownerOnlyRoutes.some(route => location.pathname.startsWith(route))) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    if (!isAdmin && adminOnlyRoutes.some(route => location.pathname.startsWith(route))) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, isAdmin, isOwner, location.pathname, navigate, requireAdmin, requireOwner]);

  // Si no hay usuario, no mostramos el layout completo
  if (!currentUser) {
    return null;
  }

  // Si la ruta requiere permisos de admin o owner y el usuario no los tiene, redirigimos
  if ((requireAdmin && !isAdmin) || (requireOwner && !isOwner)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Modal de activación de licencia */}
      {!isLicenseValid && (
        <LicenseActivationModal 
          onRetry={validateLicense}
          isChecking={isChecking}
        />
      )}
      
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
