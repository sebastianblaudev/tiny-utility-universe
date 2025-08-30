import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, isAfter, isBefore, isEqual, subMonths } from 'date-fns';
import { CalendarIcon, Search, ShoppingCart, Package, ChevronDown, ChevronRight, Eye, Printer } from 'lucide-react';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleType, ProductType } from '@/types';
import { Receipt, getCustomerPurchaseHistory } from '@/services/ReceiptService';
import { toast } from 'sonner';
import { ListTree } from '@/components/ListTree';
import { useNavigate } from 'react-router-dom';
import usePrintReceipt from '@/hooks/usePrintReceipt';

interface CustomerPurchaseHistory2Props {
  customerId: string;
}

const CustomerPurchaseHistory2: React.FC<CustomerPurchaseHistory2Props> = ({ customerId }) => {
  const [purchases, setPurchases] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { openPrintReceipt, PrintReceiptModal } = usePrintReceipt();

  useEffect(() => {
    const fetchPurchaseHistory = async () => {
      setLoading(true);
      try {
        const salesData = await getCustomerPurchaseHistory(customerId, 20);
        // Transform the sales data to match Receipt interface
        const receipts = salesData.map((sale: any) => ({
          saleId: sale.id,
          date: sale.date,
          total: sale.total,
          payment_method: sale.payment_method,
          sale_type: sale.sale_type,
          customer_name: '',
          cashier_name: '',
          items: sale.sale_items?.map((item: any) => ({
            product_name: item.products?.name || '',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            notes: item.notes
          })) || []
        }));
        setPurchases(receipts);
      } catch (error) {
        console.error("Failed to fetch customer purchase history:", error);
        toast("Error", {
          description: "No se pudo cargar el historial de compras",
        });
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchPurchaseHistory();
    }
  }, [customerId]);

  const toggleItem = (saleId: string) => {
    setOpenItems(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  const viewSaleDetails = (saleId: string) => {
    navigate(`/sales/details?id=${saleId}`);
  };

  const printReceipt = (saleId: string) => {
    openPrintReceipt(saleId);
  };

  const filterPurchasesByDate = (purchasesList: Receipt[]) => {
    if (!selectedDate) return purchasesList;

    return purchasesList.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return isEqual(
        new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate()),
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      );
    });
  };

  const filterPurchasesBySearchTerm = (purchasesList: Receipt[]) => {
    if (!searchTerm) return purchasesList;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return purchasesList.filter(purchase => {
      if (
        purchase.saleId.toLowerCase().includes(lowerSearchTerm) ||
        purchase.payment_method.toLowerCase().includes(lowerSearchTerm) ||
        purchase.total.toString().includes(lowerSearchTerm)
      ) {
        return true;
      }
      
      return purchase.items.some(item => 
        item.product_name.toLowerCase().includes(lowerSearchTerm)
      );
    });
  };

  const filteredPurchases = React.useMemo(() => {
    let filtered = [...purchases];
    filtered = filterPurchasesByDate(filtered);
    filtered = filterPurchasesBySearchTerm(filtered);
    return filtered;
  }, [purchases, selectedDate, searchTerm]);

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Cargando historial de compras...</CardContent></Card>;
  }

  if (purchases.length === 0) {
    return <Card><CardContent className="py-8 text-center">Este cliente no tiene compras registradas.</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            Historial de Compras
          </div>
          <Input
            type="search"
            placeholder="Buscar compras o productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex items-center space-x-2">
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          <p className="text-sm font-medium leading-none">
            {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Todas las fechas'}
          </p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) =>
              isAfter(date, new Date()) || isBefore(date, subMonths(new Date(), 6))
            }
            locale={es}
            className="border rounded-md"
          />
          {selectedDate && (
            <Button size="sm" onClick={() => setSelectedDate(undefined)}>
              Limpiar Filtro
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>ID Venta</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron compras con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <React.Fragment key={purchase.saleId}>
                    <TableRow 
                      className={cn(
                        "cursor-pointer",
                        openItems[purchase.saleId] && "bg-muted/60"
                      )}
                      onClick={() => toggleItem(purchase.saleId)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                          {openItems[purchase.saleId] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{format(new Date(purchase.date), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                      <TableCell className="font-medium">{purchase.saleId}</TableCell>
                      <TableCell>${purchase.total.toLocaleString('es-CL')}</TableCell>
                      <TableCell>{purchase.payment_method}</TableCell>
                      <TableCell>
                        <Badge variant={purchase.sale_type === 'presencial' ? 'default' : 'secondary'}>
                          {purchase.sale_type || 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 h-8 w-8" 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewSaleDetails(purchase.saleId);
                            }}
                            title="Ver detalle de la venta"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 h-8 w-8" 
                            onClick={(e) => {
                              e.stopPropagation();
                              printReceipt(purchase.saleId);
                            }}
                            title="Imprimir recibo"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {openItems[purchase.saleId] && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-muted/30 px-4 py-3">
                            <h4 className="font-medium mb-2">Productos:</h4>
                            <div className="rounded-md bg-background p-3">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Precio Unitario</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                    <TableHead>Notas</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {purchase.items.map((item, index) => (
                                     <TableRow key={index}>
                                       <TableCell>{item.product_name}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>${item.price.toLocaleString('es-CL')}</TableCell>
                                      <TableCell>${(item.price * item.quantity).toLocaleString('es-CL')}</TableCell>
                                      <TableCell>{item.notes || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                                    <TableCell colSpan={2} className="font-semibold">${purchase.total.toLocaleString('es-CL')}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <PrintReceiptModal />
    </Card>
  );
};

export default CustomerPurchaseHistory2;
