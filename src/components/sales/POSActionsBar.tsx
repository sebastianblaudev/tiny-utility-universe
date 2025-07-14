
import React from 'react';
import { Button } from '@/components/ui/button';
import POSDraftSales from './POSDraftSales';
import { useIsMobile } from '@/hooks/use-mobile';
import { CustomerSelector } from '@/components/CustomerSelector';
import { UserPlus } from 'lucide-react';

interface POSActionsBarProps {
  className?: string;
  children?: React.ReactNode;
}

const POSActionsBar: React.FC<POSActionsBarProps> = ({ className = '', children }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-2 ${className}`}>
      {children && <div className="flex gap-2 items-center">
        {children}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Find the CustomerSelector in the DOM and trigger its button click
            const customerSelectorButton = document.querySelector('[data-customer-selector-button]');
            if (customerSelectorButton) {
              (customerSelectorButton as HTMLButtonElement).click();
            }
          }}
          className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ml-2"
        >
          <span className="mr-2">Agregar</span>
          <UserPlus size={16} />
        </Button>
      </div>}
      <POSDraftSales />
    </div>
  );
};

export default POSActionsBar;
