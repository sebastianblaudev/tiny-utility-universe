import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, InfoIcon, Repeat } from 'lucide-react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SaleProductsViewerProps {
  saleId: string;
}

const SaleProductsViewer = ({ saleId }: SaleProductsViewerProps) => {
  const { tenantId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const fetchSaleData = async () => {
      if (!tenantId) {
        console.error('TENANT_SECURITY_WARNING: No tenant ID available');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch sale with tenant validation
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select('*, customers(*)')
          .eq('id', saleId)
          .eq('tenant_id', tenantId)
          .single();
          
        if (saleError) {
          console.error('Error fetching sale:', saleError);
          if (saleError.code === 'PGRST116') {
            console.error('TENANT_SECURITY_WARNING: Sale not found or cross-tenant access attempt', {
              saleId,
              tenantId
            });
          }
          return;
        }
        
        // Additional security check
        if (saleData.tenant_id !== tenantId) {
          console.error('TENANT_SECURITY_WARNING: Attempted cross-tenant access', {
            currentTenant: tenantId,
            requestedTenant: saleData.tenant_id,
            saleId
          });
          return;
        }
        
        // Fetch sale items with products information
        const { data: itemsData, error: itemsError } = await supabase
          .from('sale_items')
          .select(`
            *,
            products (
              id,
              name
            )
          `)
          .eq('sale_id', saleId)
          .order('created_at', { ascending: true });
          
        if (itemsError) {
          console.error('Error fetching sale items:', itemsError);
        }

        // Log any items with missing product information
        if (itemsData) {
          const missingProducts = itemsData.filter(item => !item.products);
          if (missingProducts.length > 0) {
             console.warn('Items with missing product information:', {
               saleId,
               missingProducts: missingProducts.map(p => ({
                 itemId: p.id,
                 productId: p.product_id
               }))
             });
          }
        }

        setSale(saleData);
        setItems(itemsData || []);
        setCustomer(saleData?.customers || null);
      } catch (error) {
        console.error('Error in fetchSaleData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (saleId) {
      fetchSaleData();
    }
  }, [saleId]);


  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'mixed': return 'Pago Mixto';
      default: return method;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </CardContent>
      </Card>
    );
  }

  if (!sale) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            No se encontraron datos para esta venta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl">
              Venta #{saleId.substring(0, 8)}
            </CardTitle>
            <CardDescription>
              {sale.date && format(new Date(sale.date), "PPpp", { locale: es })}
              
              {sale.payment_method && (
                <Badge variant="outline" className="ml-2 gap-1">
                  <CreditCard className="h-3 w-3" />
                  <span>{getPaymentMethodLabel(sale.payment_method)}</span>
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {items.length > 0 ? (
          <div className="divide-y">
            {customer && (
              <div className="pb-4 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  <InfoIcon className="h-4 w-4 inline mr-1" />
                  Información del Cliente
                </h3>
                <div className="pl-6">
                  <p className="font-medium">{customer.name}</p>
                  {customer.email && <p className="text-sm">{customer.email}</p>}
                  {customer.phone && <p className="text-sm">{customer.phone}</p>}
                </div>
              </div>
            )}
            
            <div className="py-4">
              <h3 className="font-medium mb-3">Productos</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                       <p className="font-medium">
                         {item.quantity} x {item.products?.name || item.name || "Producto sin nombre"}
                       </p>
                      {item.is_by_weight && (
                        <p className="text-sm text-muted-foreground">
                          {item.weight} {item.unit || "kg"}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between items-center py-2">
                <p className="font-medium">Total</p>
                <p className="text-xl font-bold">{formatCurrency(sale.total)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No se encontraron productos para esta venta.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SaleProductsViewer;
