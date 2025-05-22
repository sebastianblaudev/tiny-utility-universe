
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, ExternalLink, Award, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";

const License = () => {
  const { user, profile } = useAuth();
  const [isActivated, setIsActivated] = useState(true);
  
  const handleActivateLicense = () => {
    // En una implementación real, esto llamaría a una API para activar la licencia
    toast.success("Licencia activada correctamente", {
      description: "Tu dispositivo ha sido registrado.",
    });
    setIsActivated(true);
  };

  useEffect(() => {
    // Ahora la licencia siempre está activa
    setIsActivated(true);
  }, [user]);

  return (
    <div className="container max-w-5xl py-12">
      <h1 className="text-4xl font-bold mb-8 text-chile-blue font-heading">
        Licencia CotiPro Chile
      </h1>
      
      <Card className="mb-8 border-0 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-chile-blue to-chile-red opacity-10 rounded-bl-full"></div>
        
        <CardHeader className="border-b bg-neutral-light pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Shield className="text-chile-blue h-6 w-6" />
            Estado de Licencia
          </CardTitle>
          <CardDescription className="text-base">
            Información acerca de tu licencia y dispositivos registrados.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-light p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2 text-gray-500">Email Registrado</h3>
                <p className="text-lg text-gray-700 font-medium">{user?.email || "No disponible"}</p>
              </div>
              
              <div className="bg-neutral-light p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2 text-gray-500">Estado</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500 text-white">
                    Activa
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-neutral-light p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="text-chile-blue h-5 w-5" />
                <h3 className="text-sm font-medium text-gray-700">Dispositivos Registrados</h3>
              </div>
              <div className="ml-8 mt-2">
                <p className="text-gray-700 font-medium">
                  1 dispositivo (este)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu licencia es válida para 1 dispositivo registrado.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start space-y-4 border-t pt-6 bg-neutral-light">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Licencia Activa</span>
            </div>
            
            <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-chile-blue to-chile-blue/90 hover:from-chile-blue/90 hover:to-chile-blue">
              <a href="https://www.dadfaf.cl/licencia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <span>Comprar Licencia</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            La licencia está asociada a tu cuenta ({user?.email}) y permite el uso en un dispositivo.
          </p>
          
          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg w-full">
            <Clock className="text-amber-600 h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600">
              Nota: El sistema se mantendrá activado durante 24 horas si la licencia no está activa. 
              Después de ese período, el sistema será bloqueado hasta que se active la licencia.
            </p>
          </div>
        </CardFooter>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-neutral-light">
          <CardTitle className="flex items-center gap-3">
            <Award className="text-chile-blue h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="bg-neutral-light p-4 rounded-lg">
              <h3 className="font-medium text-chile-blue">¿Cómo funciona la activación?</h3>
              <p className="text-sm text-gray-700 mt-2">
                La licencia se activa automáticamente en este dispositivo al iniciar sesión con tu cuenta.
              </p>
            </div>
            
            <div className="bg-neutral-light p-4 rounded-lg">
              <h3 className="font-medium text-chile-blue">¿Puedo cambiar el dispositivo registrado?</h3>
              <p className="text-sm text-gray-700 mt-2">
                Sí, puedes desactivar la licencia en este dispositivo y activarla en otro.
                Contacta a soporte si necesitas ayuda con este proceso.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default License;
