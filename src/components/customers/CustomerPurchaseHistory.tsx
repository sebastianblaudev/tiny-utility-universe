
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { format, isAfter, isBefore, isEqual, subMonths } from 'date-fns';
import { CalendarIcon, Search, ShoppingCart, Package } from 'lucide-react';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleType } from '@/types';
import { getCustomerById, getCustomerSales, supabase } from '@/integrations/supabase/client';
import type { CustomerType } from '@/integrations/supabase/client';
import { Modal } from '@/components/Modal';

interface CustomerPurchaseHistoryProps {
  customerId: string;
}

const CustomerPurchaseHistory: React.FC<CustomerPurchaseHistoryProps> = ({ customerId }) => {
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [sales, setSales] = useState<SaleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleType | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const customerData = await getCustomerById(customerId);
        setCustomer(customerData);

        const salesData = await getCustomerSales(customerId);
        setSales(salesData);
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const filterSalesByDate = (salesList: SaleType[]) => {
    if (!selectedDate) return salesList;

    return salesList.filter(sale => {
      const saleDate = new Date(sale.date);
      return isEqual(saleDate, selectedDate);
    });
  };

  const filterSalesBySearchTerm = (salesList: SaleType[]) => {
    if (!searchTerm) return salesList;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return salesList.filter(sale => {
      return sale.id.toLowerCase().includes(lowerSearchTerm) ||
             sale.payment_method.toLowerCase().includes(lowerSearchTerm) ||
             sale.total.toString().includes(lowerSearchTerm);
    });
  };

  const filterSalesByTab = (salesList: SaleType[]) => {
    if (activeTab === 'all') return salesList;

    return salesList.filter(sale => sale.status === activeTab);
  };

  const filteredSales = React.useMemo(() => {
    let filtered = [...sales];
    filtered = filterSalesByDate(filtered);
    filtered = filterSalesBySearchTerm(filtered);
    filtered = filterSalesByTab(filtered);
    return filtered;
  }, [sales, selectedDate, searchTerm, activeTab]);

  const openProductModal = (sale: SaleType) => {
    setSelectedSale(sale);
    setIsProductModalOpen(true);
  };

  if (loading) {
    return <Card><CardContent>Loading...</CardContent></Card>;
  }

  if (!customer) {
    return <Card><CardContent>Customer not found.</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            Purchase History for {customer.name}
          </div>
          <Input
            type="search"
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex items-center space-x-2">
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          <p className="text-sm font-medium leading-none">
            {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Select a date'}
          </p>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) =>
              isAfter(date, new Date()) || isBefore(date, subMonths(new Date(), 3))
            }
            locale={es}
            className="border rounded-md"
          />
          <Button size="sm" onClick={() => setSelectedDate(undefined)}>
            Clear Date
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="completed">
              <Badge variant="outline">Completed</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Badge variant="secondary">Pending</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-2">
            <SalesTable sales={filteredSales} openProductModal={openProductModal} />
          </TabsContent>
          <TabsContent value="completed" className="space-y-2">
            <SalesTable sales={filteredSales} openProductModal={openProductModal} />
          </TabsContent>
          <TabsContent value="pending" className="space-y-2">
            <SalesTable sales={filteredSales} openProductModal={openProductModal} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <ProductsModal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        sale={selectedSale} 
      />
    </Card>
  );
};

interface SalesTableProps {
  sales: SaleType[];
  openProductModal: (sale: SaleType) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({ sales, openProductModal }) => {
  if (!sales || sales.length === 0) {
    return <div>No sales found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sale ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="font-medium">{sale.id}</TableCell>
            <TableCell>{format(new Date(sale.date), 'PPP', { locale: es })}</TableCell>
            <TableCell>${sale.total}</TableCell>
            <TableCell>{sale.payment_method}</TableCell>
            <TableCell>{sale.status}</TableCell>
            <TableCell>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openProductModal(sale)}
                className="flex items-center gap-1"
              >
                <Package size={16} />
                Ver productos
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleType | null;
}

const ProductsModal: React.FC<ProductsModalProps> = ({ isOpen, onClose, sale }) => {
  const [products, setProducts] = useState<{name: string, quantity: number, price: number}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!sale) return;
      
      setLoading(true);
      try {
        // Get sale items
        const { data: saleItems, error: itemsError } = await supabase
          .from('sale_items')
          .select('quantity, price, product_id')
          .eq('sale_id', sale.id);
        
        if (itemsError || !saleItems || saleItems.length === 0) {
          console.error('Error fetching sale items:', itemsError);
          setProducts([]);
          return;
        }
        
        // Get product details for each sale item
        const productDetails = await Promise.all(
          saleItems.map(async (item) => {
            const { data: product, error: productError } = await supabase
              .from('products')
              .select('name')
              .eq('id', item.product_id)
              .single();
            
            return {
              name: product?.name || 'Producto desconocido',
              quantity: item.quantity,
              price: item.price
            };
          })
        );
        
        setProducts(productDetails);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [sale]);

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Productos de la venta #${sale.id}`}
      description={`Fecha: ${format(new Date(sale.date), 'PPP', { locale: es })}`}
      size="md"
    >
      {loading ? (
        <div className="py-8 text-center">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center">No hay productos disponibles para esta venta.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>${product.price.toLocaleString('es-CL')}</TableCell>
                <TableCell>${(product.quantity * product.price).toLocaleString('es-CL')}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
              <TableCell className="font-semibold">${sale.total.toLocaleString('es-CL')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </Modal>
  );
};

export default CustomerPurchaseHistory;
