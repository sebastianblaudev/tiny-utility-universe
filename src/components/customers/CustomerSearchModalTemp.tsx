import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const CustomerSearchModalTemp: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customers de ejemplo para evitar errores de DB
  const mockCustomers: Customer[] = [
    { id: '1', name: 'Juan Pérez', phone: '123456789', address: 'Calle 123' },
    { id: '2', name: 'María García', phone: '987654321', address: 'Avenida 456' }
  ];

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredCustomers.map(customer => (
              <Button
                key={customer.id}
                variant="outline"
                className="w-full justify-start p-4 h-auto"
                onClick={() => {
                  onSelectCustomer(customer);
                  onClose();
                }}
              >
                <div className="text-left">
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.phone}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSearchModalTemp;