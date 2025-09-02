
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCustomerById } from '@/lib/supabase-helpers';
import RecentPurchases from './RecentPurchases';
import { Phone, Mail, Home, User, FileEdit, ArrowLeft, Eye } from 'lucide-react';
import { getCustomerPurchaseHistory, getReceiptData } from '@/services/ReceiptService';
import Ticket from '../Ticket';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CustomerViewProps {
  customerId: string;
  onBack: () => void;
  onEdit?: (customerId: string) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ customerId, onBack, onEdit }) => {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLatestPurchase, setShowLatestPurchase] = useState(false);
  const [latestPurchase, setLatestPurchase] = useState<any>(null);
  const [loadingPurchase, setLoadingPurchase] = useState(false);

  useEffect(() => {
    const loadCustomer = async () => {
      setLoading(true);
      try {
        const customerData = await getCustomerById(customerId);
        setCustomer(customerData);
      } catch (error) {
        console.error('Error loading customer:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  const handleViewLatestPurchase = async () => {
    setLoadingPurchase(true);
    try {
      // First get the most recent sale ID
      const purchases = await getCustomerPurchaseHistory(customerId.toString(), localStorage.getItem('current_tenant_id') || '');
      if (purchases && purchases.length > 0) {
        // Instead of using the purchase history data directly, use getReceiptData
        // to get complete product information using the same query as the receipt
        const saleId = purchases[0].saleId;
        const receiptData = await getReceiptData(saleId, undefined);
        
        if (receiptData) {
          setLatestPurchase(receiptData);
          setShowLatestPurchase(true);
        } else {
          toast.error("No se pudieron cargar los detalles de la última compra");
        }
      } else {
        console.log('No purchases found for this customer');
        toast.info("Este cliente no tiene compras registradas");
      }
    } catch (error) {
      console.error('Error loading latest purchase:', error);
      toast.error("Error al cargar la última compra");
    } finally {
      setLoadingPurchase(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>Cargando información del cliente...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>No se encontró el cliente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a lista de clientes
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewLatestPurchase}
            disabled={loadingPurchase}
          >
            <Eye className="h-4 w-4 mr-1" />
            {loadingPurchase ? 'Cargando...' : 'Ver última compra'}
          </Button>
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(customerId)}>
              <FileEdit className="h-4 w-4 mr-1" />
              Editar cliente
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{customer.name}</span>
          </div>
          
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
          )}
          
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          
          {customer.address && (
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>{customer.address}</span>
            </div>
          )}

          {customer.notes && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="font-medium mb-1">Notas:</p>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RecentPurchases customerId={customerId} limit={10} />

      <Dialog open={showLatestPurchase} onOpenChange={setShowLatestPurchase}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Última Compra</DialogTitle>
          </DialogHeader>
          {latestPurchase ? (
            <Ticket ticketData={latestPurchase} />
          ) : (
            <div className="py-4 text-center text-gray-500">
              No hay compras registradas para este cliente.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerView;
