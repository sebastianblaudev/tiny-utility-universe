
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { LicenseStatus, checkBusinessLicense, activateLicense } from "@/lib/license";
import { Auth } from "@/lib/auth";

const ActivateLicense = () => {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = Auth.getInstance();

  useEffect(() => {
    const checkLicense = async () => {
      const user = auth.currentUser;
      if (!user?.username) {
        navigate('/login');
        return;
      }

      const licenseStatus = await checkBusinessLicense(user.username);
      setStatus(licenseStatus);
      setLoading(false);

      // Si la licencia es válida, redirigir al dashboard
      if (licenseStatus.isValid) {
        navigate('/');
      }
    };

    checkLicense();
  }, [navigate]);

  const handleActivateLicense = async () => {
    if (!status?.businessId || !licenseKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa una clave de licencia válida",
      });
      return;
    }

    setActivating(true);
    try {
      const result = await activateLicense(status.businessId, licenseKey);
      
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
        
        // Verificar el estado actualizado de la licencia
        const updatedStatus = await checkBusinessLicense(auth.currentUser?.username || '');
        setStatus(updatedStatus);
        
        if (updatedStatus.isValid) {
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al activar la licencia",
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p>Verificando licencia...</p>
    </div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md space-y-6 bg-card p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Estado de Licencia
        </h1>

        {status && (
          <div className="space-y-4">
            {status.name && (
              <div className="text-center">
                <h2 className="font-semibold">{status.name}</h2>
                <p className="text-sm text-muted-foreground">{status.email}</p>
              </div>
            )}

            {status.isLocalLicense && (
              <div className="bg-yellow-500/10 p-4 rounded-md">
                <p className="text-center font-medium text-yellow-600">
                  Usando licencia local (modo sin conexión)
                </p>
              </div>
            )}

            {!status.isValid && (
              <div className="bg-destructive/10 p-4 rounded-md">
                <p className="text-destructive text-center">
                  {status.daysLeft && status.daysLeft < 0 
                    ? 'Tu período de prueba ha expirado'
                    : !status.isActive 
                      ? 'Tu cuenta ha sido desactivada'
                      : 'Licencia no válida'}
                </p>
              </div>
            )}

            {status.daysLeft && status.daysLeft > 0 && (
              <div className="bg-yellow-500/10 p-4 rounded-md">
                <p className="text-center">
                  Te quedan <span className="font-bold">{status.daysLeft}</span> días de prueba
                </p>
              </div>
            )}

            {!status.isValid && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="license-key" className="block text-sm font-medium text-foreground">
                    Clave de Licencia
                  </label>
                  <Input
                    id="license-key"
                    type="text"
                    placeholder="Ingresa tu clave de licencia"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  variant="default"
                  disabled={activating || !licenseKey}
                  onClick={handleActivateLicense}
                >
                  {activating ? "Activando..." : "Activar Licencia"}
                </Button>
              </div>
            )}

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                auth.logout();
                navigate('/login');
              }}
            >
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateLicense;
