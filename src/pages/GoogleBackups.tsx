
import React from 'react';
import { GoogleDriveBackupPanel } from '@/components/backup/GoogleDriveBackupPanel';
import { BackButton } from '@/components/BackButton';
import { GOOGLE_API_CREDENTIALS } from '@/utils/googleApiCredentials';

export default function GoogleBackups() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white w-full m-0 p-0">
      <div className="p-4 relative">
        <BackButton />
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-white text-center">
            Respaldos en Google Drive Personal
          </h1>
          
          <div className="space-y-6">
            {/* Información general */}
            <div className="mb-8 bg-[#1A1A1A] p-6 rounded-lg border border-zinc-800">
              <h2 className="text-xl font-semibold mb-4">
                ¿Cómo funcionan los respaldos en Google Drive?
              </h2>
              <div className="space-y-3 text-gray-300">
                <p>
                  Los respaldos en Google Drive te permiten guardar copias de seguridad
                  de todos tus datos en tu cuenta personal de Google Drive.
                </p>
                <p>
                  Beneficios de usar Google Drive para tus respaldos:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Los datos se guardan en tu cuenta personal de Google Drive</li>
                  <li>Accede a tus respaldos desde cualquier dispositivo</li>
                  <li>15GB de almacenamiento gratuito</li>
                  <li>Historial de versiones para recuperar respaldos antiguos</li>
                  <li>Configuración de respaldos automáticos</li>
                </ul>
                <p className="mt-4 text-xs border-t border-zinc-700 pt-4 text-zinc-400">
                  ID de Cliente configurado: {GOOGLE_API_CREDENTIALS.CLIENT_ID.substring(0, 12)}...
                </p>
              </div>
            </div>
            
            {/* Panel de Google Drive */}
            <GoogleDriveBackupPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
