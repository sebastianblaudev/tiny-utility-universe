
import React from 'react';
import SaveSaleButton from './SaveSaleButton';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface POSDraftSalesProps {
  className?: string;
}

const POSDraftSales: React.FC<POSDraftSalesProps> = ({ className = '' }) => {
  const { cartItems } = useCart();
  
  return (
    <Card className={`p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Guardar/Cargar Venta</h3>
        
        <div className="flex gap-1">
          <SaveSaleButton />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const event = new CustomEvent('open-draft-dialog');
              window.dispatchEvent(event);
            }}
            title="Cargar venta guardada"
            className="h-9"
          >
            <FileDown className="h-4 w-4 mr-1" />
            <span>Cargar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default POSDraftSales;
