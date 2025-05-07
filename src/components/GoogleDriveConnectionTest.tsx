
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { GOOGLE_API_CREDENTIALS } from '@/utils/googleApiCredentials';
import { CheckCircle, XCircle, Loader2, RefreshCw, LogIn, LogOut } from "lucide-react";

export function GoogleDriveConnectionTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // Cargar el script de la API de Google
  useEffect(() => {
    const loadGoogleApi = async () => {
      if (window.gapi) {
        setIsGapiLoaded(true);
        return;
      }
      
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.onload = () => {
            console.log("Google API script cargado");
            setIsGapiLoaded(true);
            resolve();
          };
          script.onerror = (error) => {
            console.error("Error al cargar Google API script:", error);
            reject(error);
          };
          document.body.appendChild(script);
        });
      } catch (error) {
        console.error("Error al cargar script de Google API:", error);
        setStatus('error');
        setMessage('Error al cargar el script de Google API');
      }
    };
    
    loadGoogleApi();
  }, []);
  
  // Función para inicializar la API de Google
  const initializeGoogleApi = async () => {
    if (!window.gapi) {
      setStatus('error');
      setMessage('Google API no está disponible');
      return false;
    }
    
    try {
      return await new Promise<boolean>((resolve) => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_CREDENTIALS.API_KEY,
              clientId: GOOGLE_API_CREDENTIALS.CLIENT_ID,
              discoveryDocs: GOOGLE_API_CREDENTIALS.DISCOVERY_DOCS,
              scope: GOOGLE_API_CREDENTIALS.SCOPES,
            });
            
            const isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
            setIsAuthorized(isSignedIn);
            
            if (isSignedIn) {
              const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
              const profile = googleUser.getBasicProfile();
              setUserInfo({
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                imageUrl: profile.getImageUrl()
              });
            }
            
            resolve(true);
          } catch (error) {
            console.error("Error al inicializar Google API:", error);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error("Error en initializeGoogleApi:", error);
      return false;
    }
  };
  
  // Función para probar la conexión
  const testConnection = async () => {
    setIsLoading(true);
    setStatus('loading');
    setMessage('Probando conexión con Google Drive...');
    
    try {
      const initialized = await initializeGoogleApi();
      
      if (!initialized) {
        setStatus('error');
        setMessage('Error al inicializar la API de Google. Verifica las credenciales y la consola del navegador para más detalles.');
        setIsLoading(false);
        return;
      }
      
      // Si hemos llegado hasta aquí, la inicialización fue exitosa
      setStatus('success');
      setMessage('Conexión exitosa con la API de Google Drive.');
      
    } catch (error) {
      console.error("Error en la prueba de conexión:", error);
      setStatus('error');
      setMessage(`Error al conectar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Iniciar sesión en Google
  const handleSignIn = async () => {
    setIsLoading(true);
    
    try {
      if (!window.gapi.auth2) {
        await initializeGoogleApi();
      }
      
      await window.gapi.auth2.getAuthInstance().signIn();
      setIsAuthorized(true);
      
      const googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
      const profile = googleUser.getBasicProfile();
      
      setUserInfo({
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl()
      });
      
      setStatus('success');
      setMessage('Inicio de sesión exitoso');
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setStatus('error');
      setMessage(`Error al iniciar sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cerrar sesión en Google
  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      if (!window.gapi.auth2) {
        await initializeGoogleApi();
      }
      
      await window.gapi.auth2.getAuthInstance().signOut();
      setIsAuthorized(false);
      setUserInfo(null);
      setStatus('idle');
      setMessage('Sesión cerrada');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setStatus('error');
      setMessage(`Error al cerrar sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Prueba de Conexión con Google Drive</CardTitle>
        <CardDescription>
          Verifica que las credenciales de Google Drive funcionan correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span>Google API Script:</span>
            {isGapiLoaded ? 
              <CheckCircle className="h-5 w-5 text-green-500" /> : 
              <XCircle className="h-5 w-5 text-red-500" />
            }
          </div>
          <div className="flex items-center gap-2">
            <span>Autorizado:</span>
            {isAuthorized ? 
              <CheckCircle className="h-5 w-5 text-green-500" /> : 
              <XCircle className="h-5 w-5 text-red-500" />
            }
          </div>
        </div>
        
        {status === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Conexión exitosa</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {userInfo && (
          <div className="border rounded-md p-4">
            <div className="font-semibold">Usuario conectado:</div>
            <div className="flex items-center gap-3 mt-2">
              {userInfo.imageUrl && (
                <img 
                  src={userInfo.imageUrl} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div>{userInfo.name}</div>
                <div className="text-sm text-gray-600">{userInfo.email}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 border rounded-md p-3">
          <div className="font-medium mb-1">Credenciales configuradas:</div>
          <div className="text-xs font-mono bg-gray-100 p-2 rounded mb-2 overflow-x-auto">
            <div><span className="text-blue-600">CLIENT_ID:</span> {GOOGLE_API_CREDENTIALS.CLIENT_ID}</div>
            <div><span className="text-blue-600">API_KEY:</span> {GOOGLE_API_CREDENTIALS.API_KEY}</div>
            <div><span className="text-blue-600">SCOPES:</span> {GOOGLE_API_CREDENTIALS.SCOPES}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          className="w-full" 
          onClick={testConnection} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Probar Conexión
        </Button>
        
        {!isAuthorized ? (
          <Button 
            className="w-full" 
            onClick={handleSignIn} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Iniciar Sesión con Google
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleSignOut} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Cerrar Sesión
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
