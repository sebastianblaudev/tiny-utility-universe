
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import SaleProductsViewer from '@/components/sales/SaleProductsViewer';
import TenantSecurityAlert from '@/components/TenantSecurityAlert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const SaleDetails = () => {
  const [searchParams] = useSearchParams();
  const saleId = searchParams.get('id');
  const navigate = useNavigate();
  
  
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <TenantSecurityAlert />
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Detalles de Venta</CardTitle>
                <CardDescription>
                  ID de la venta: {saleId || 'No especificado'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Volver
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {saleId ? (
          <SaleProductsViewer saleId={saleId} />
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                No se ha especificado un ID de venta válido. Por favor, proporcione un ID de venta.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SaleDetails;
