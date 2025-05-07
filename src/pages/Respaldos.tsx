
import React from 'react';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Cloud, HardDrive, Database, CloudCog } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Respaldos() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="p-4 relative">
        <BackButton />
        
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-center">Gestión de Respaldos</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1A1A1A] text-white border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-orange-500" />
                  Respaldo Local
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Guarda un respaldo completo en tu dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">
                  Crea un archivo JSON con todos los datos de tu sistema que puedes guardar en tu dispositivo.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.location.href = '/backups?action=download'} 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Respaldo
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/backups?action=restore'} 
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar desde Archivo
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-[#1A1A1A] text-white border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  Respaldo en la Nube
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Guarda tus respaldos en servicios en la nube
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">
                  Utiliza distintos servicios en la nube para mantener tus datos seguros y accesibles desde cualquier lugar.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Link to="/online-backup" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <CloudCog className="h-4 w-4 mr-2" />
                    Respaldo Automático
                  </Button>
                </Link>
                
                <Link to="/google-drive-backup" className="w-full">
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <svg 
                      className="h-4 w-4 mr-2" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4.433 22L12 7l7.567 15H4.433zm3.068-3h9l-4.5-8.9-4.5 8.9z" fill="#FFFFFF"/>
                      <path d="M17.134 19h6.234L18.866 9h-6.234l4.502 10z" fill="#FFFFFF"/>
                      <path d="M6.866 19H0.632L5.134 9h6.234L6.866 19z" fill="#FFFFFF"/>
                    </svg>
                    Google Drive
                  </Button>
                </Link>
                
                <Link to="/google-backups" className="w-full">
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    <Database className="h-4 w-4 mr-2" />
                    Supabase Storage
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
