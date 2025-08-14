
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';

export type SaleType = 'Normal' | 'Delivery' | 'Comer Aquí' | 'Mesa';

export const SALE_TYPES: SaleType[] = ['Normal', 'Delivery', 'Comer Aquí', 'Mesa'];

interface SaleTypeSelectorProps {
  value: SaleType;
  onChange: (value: SaleType) => void;
  className?: string;
}

const SaleTypeSelector: React.FC<SaleTypeSelectorProps> = ({ value, onChange, className }) => {
  return (
    <div className={className}>
      <Select value={value} onValueChange={(v) => onChange(v as SaleType)}>
        <SelectTrigger className="w-full h-8 text-sm border-transparent bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-transparent focus:ring-primary">
          <SelectValue placeholder="Tipo de venta" />
        </SelectTrigger>
        <SelectContent>
          {SALE_TYPES.map((type) => (
            <SelectItem key={type} value={type} className="flex items-center">
              <span className="flex items-center gap-2">
                {type === value && <Check className="h-4 w-4" />}
                {type}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SaleTypeSelector;
