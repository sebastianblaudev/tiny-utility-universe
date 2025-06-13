
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SystemReadinessCheck from '@/components/SystemReadinessCheck';

const SystemStatusPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Estado del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Verificación de la preparación del sistema para distribución
          </p>
        </div>

        <SystemReadinessCheck />
      </div>
    </div>
  );
};

export default SystemStatusPage;
