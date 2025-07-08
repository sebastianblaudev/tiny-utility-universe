
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'cashier')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles = ['admin', 'cashier'] }) => {
  const { user, loading, userRole, lockedMenuItems, tenantId } = useAuth();
  const location = useLocation();
  
  const hasRequiredRole = requiredRoles.includes(userRole);
  const isRouteLocked = lockedMenuItems.includes(location.pathname);
  const isAuthRoute = ['/login', '/register', '/recuperar-contrasena'].includes(location.pathname);
  
  useEffect(() => {
    // Only show toasts if we're NOT on an auth route
    if (!isAuthRoute) {
      if (!loading && !user) {
        toast({
          title: "Acceso restringido",
          description: "Debe iniciar sesión para acceder a esta página",
          variant: "destructive",
        });
      } else if (!loading && user && !hasRequiredRole) {
        toast({
          title: "Acceso restringido",
          description: "No tiene permisos para acceder a esta página",
          variant: "destructive",
        });
      } else if (!loading && user && isRouteLocked) {
        toast({
          title: "Funcionalidad bloqueada",
          description: "Esta funcionalidad ha sido bloqueada por el administrador",
          variant: "destructive",
        });
      } else if (!loading && user && !tenantId) {
        toast({
          title: "Configuración incompleta",
          description: "Su cuenta no tiene un espacio de trabajo asignado",
          variant: "destructive", 
        });
      }
    }
  }, [loading, user, hasRequiredRole, isRouteLocked, tenantId, isAuthRoute]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // Allow access to auth routes regardless of login status
  if (isAuthRoute) {
    // If user is already logged in and tries to access auth routes, redirect to dashboard
    if (user) {
      return <Navigate to="/dashboard" />;
    }
    return <>{children}</>;
  }
  
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  
  // If user doesn't have a tenant ID, redirect to configuration page
  if (!tenantId) {
    // Only redirect if not already on the configuration page
    if (location.pathname !== "/configuracion") {
      return <Navigate to="/configuracion" />;
    }
  }
  
  // Si la ruta está bloqueada, redirigir al POS (o página principal)
  if (isRouteLocked) {
    return <Navigate to="/pos" />;
  }
  
  // If user doesn't have the required role, redirect to the POS page
  // Cajeros son redirigidos a POS si intentan acceder a páginas restringidas
  if (!hasRequiredRole) {
    return <Navigate to="/pos" />;
  }
  
  // If user is authenticated and has the required role, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
