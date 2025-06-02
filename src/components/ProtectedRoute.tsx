
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until auth state is loaded
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  if (!isReady) {
    // Show loading state
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chile-blue"></div>
      </div>
    );
  }

  // If no user or user is banned, redirect to auth page
  if (!user || (profile && profile.is_banned)) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated and not banned, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
