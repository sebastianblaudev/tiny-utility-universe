
import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUserTenantId } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Receipt } from '@/services/ReceiptService';
import RecentPurchasesView from './RecentPurchasesView';

interface RecentPurchasesProps {
  customerId: string;
  limit?: number;
  standalone?: boolean;
}

const RecentPurchases = ({ customerId, limit = 5, standalone = false }: RecentPurchasesProps) => {
  const [initialPurchases, setInitialPurchases] = useState<Receipt[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { tenantId: contextTenantId } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const getTenantId = async () => {
      try {
        // First try to get tenant ID from context
        if (contextTenantId) {
          console.log("RecentPurchases - Using tenant ID from context:", contextTenantId);
          setTenantId(contextTenantId);
          return;
        }
        
        // Then try to get from client function
        const tid = await getCurrentUserTenantId();
        
        if (tid) {
          console.log("RecentPurchases - Using tenant ID from getCurrentUserTenantId:", tid);
          setTenantId(tid);
        } else {
          // Fallback to user metadata
          const { data: { user } } = await supabase.auth.getUser();
          const userTid = user?.user_metadata?.tenant_id;
          
          if (userTid) {
            console.log("RecentPurchases - Using tenant ID from user metadata:", userTid);
            setTenantId(userTid);
          } else {
            // Fallback to local storage
            const localTid = localStorage.getItem('current_tenant_id');
            if (localTid) {
              console.log("RecentPurchases - Using tenant ID from localStorage:", localTid);
              setTenantId(localTid);
            } else {
              console.error("RecentPurchases - No tenant ID available");
              toast.error("Error: No se pudo identificar el negocio");
            }
          }
        }
      } catch (err) {
        console.error("RecentPurchases - Error getting tenant ID:", err);
        toast.error("Error al obtener información del negocio");
      }
    };
    
    getTenantId();
  }, [contextTenantId]);

  const fetchPurchases = async () => {
    if (!customerId || !tenantId) {
      console.log("RecentPurchases - Missing customerId or tenantId:", { customerId, tenantId });
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      console.log(`RecentPurchases - Fetching purchases for customer: ${customerId}, tenant: ${tenantId}`);
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          date,
          total,
          payment_method,
          sale_type,
          sale_items (
            id,
            quantity,
            price,
            product_id,
            products (name)
          )
        `)
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('RecentPurchases - Error fetching customer purchases:', error);
        toast.error('Error al cargar historial de compras');
        setInitialPurchases([]);
        setLoading(false);
        return;
      }

      console.log(`RecentPurchases - Found ${data?.length || 0} purchases for customer ${customerId}`);
      
      if (!data || data.length === 0) {
        setInitialPurchases([]);
        setLoading(false);
        return;
      }
      
      // Transform data to match Receipt structure from ReceiptService
      const formattedPurchases: Receipt[] = data.map(sale => ({
        saleId: sale.id,
        date: sale.date || new Date().toISOString(),
        total: sale.total || 0,
        paymentMethod: sale.payment_method || 'efectivo',
        saleType: sale.sale_type || 'normal',
        items: (sale.sale_items || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity || 0,
          price: item.price || 0,
          name: item.products?.name || 'Producto desconocido',
          subtotal: (item.quantity || 0) * (item.price || 0)
        }))
      }));
      
      setInitialPurchases(formattedPurchases);
    } catch (err) {
      console.error('RecentPurchases - Exception in fetch purchases:', err);
      toast.error('Error al cargar historial de compras');
      setInitialPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchPurchases();
    }
  }, [customerId, limit, tenantId]);

  return (
    <RecentPurchasesView
      customerId={customerId}
      limit={limit}
      standalone={standalone}
      initialPurchases={initialPurchases}
      isLoading={loading}
    />
  );
};

export const openRecentPurchasesInNewWindow = (customerId: string) => {
  const url = `/customer-purchases?id=${customerId}`;
  window.open(url, '_blank');
};

export default RecentPurchases;
