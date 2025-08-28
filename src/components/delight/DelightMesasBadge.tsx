import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Utensils } from 'lucide-react';

interface DelightMesasBadgeProps {
  mesaName?: string;
  itemsCount?: number;
  total?: number;
}

export const DelightMesasBadge: React.FC<DelightMesasBadgeProps> = ({
  mesaName,
  itemsCount = 0,
  total = 0
}) => {
  if (!mesaName) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Utensils className="h-4 w-4 text-orange-600" />
        <span className="font-medium text-orange-800">{mesaName}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {itemsCount} items
        </Badge>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          ${total.toFixed(2)}
        </Badge>
      </div>
    </div>
  );
};