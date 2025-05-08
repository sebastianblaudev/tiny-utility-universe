
import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, isBanned, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Re-verify route protection if auth status changes
    if (user && isBanned) {
      navigate("/account-disabled", { state: { from: location }, replace: true });
    } else if (profile && !profile.activo) {
      navigate("/account-disabled", { state: { from: location }, replace: true });
    }
  }, [user, profile, isBanned, navigate, location]);

  // Handle loading state (might not be necessary anymore)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Verificando acceso...</p>
      </div>
    );
  }

  // Si no está autenticado, redireccionar a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está baneado, redireccionar a account-disabled
  if (isBanned) {
    return <Navigate to="/account-disabled" state={{ from: location }} replace />;
  }

  // Si el perfil existe pero no está activo, redireccionar a account-disabled
  if (profile && !profile.activo) {
    return <Navigate to="/account-disabled" state={{ from: location }} replace />;
  }

  // Mostrar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;
