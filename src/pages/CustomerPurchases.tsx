import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCustomerById } from '@/lib/supabase-helpers';
import RecentPurchasesView from '@/components/customers/RecentPurchasesView';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/ui/page-title';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import usePrintReceipt from '@/hooks/usePrintReceipt';

const CustomerPurchases = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id');
  const [customerName, setCustomerName] = useState<string>('');
  const { tenantId } = useAuth();
  const { PrintReceiptModal } = usePrintReceipt();
  
  useEffect(() => {
    const loadCustomerName = async () => {
      if (customerId) {
        const customer = await getCustomerById(customerId);
        if (customer) {
          setCustomerName(customer.name);
          document.title = `Compras de ${customer.name}`;
        }
      }
    };
    
    loadCustomerName();
    
    console.log("CustomerPurchases - Using tenant ID:", tenantId);
  }, [customerId, tenantId]);
  
  if (!customerId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Card className="p-8 max-w-md w-full">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-2">Error</h1>
              <p>No se ha especificado un cliente válido</p>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <PageTitle title={`Historial de Compras${customerName ? ` - ${customerName}` : ''}`} />
        <RecentPurchasesView customerId={customerId} limit={20} standalone={true} />
        <PrintReceiptModal />
      </div>
    </Layout>
  );
};

export default CustomerPurchases;
