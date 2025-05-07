
import React from 'react';
import { BackButton } from '@/components/BackButton';
import { GoogleDriveConnectionTest } from '@/components/GoogleDriveConnectionTest';

export default function GoogleDriveTest() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="p-4 relative">
        <BackButton />
        
        <div className="max-w-4xl mx-auto mt-12">
          <h1 className="text-2xl font-bold mb-6 text-center">Prueba de Conexión con Google Drive</h1>
          
          <GoogleDriveConnectionTest />
        </div>
      </div>
    </div>
  );
}
