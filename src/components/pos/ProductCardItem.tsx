
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, User } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useLanguageCurrency } from '@/hooks/useLanguageCurrency';

interface ProductCardItemProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBarberSelect?: (product: Product) => void;
  selected?: boolean;
}

const ProductCardItem: React.FC<ProductCardItemProps> = ({ 
  product, 
  onAddToCart, 
  onBarberSelect,
  selected = false 
}) => {
  const { formatCurrency, getText } = useLanguageCurrency();

  return (
    <Card 
      className={cn(
        "cursor-pointer h-full transition-all shadow-sm hover:shadow-md",
        selected && "ring-2 ring-barber-500 bg-barber-50"
      )}
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-4 pb-2">
        <div className="flex justify-between items-start space-x-2">
          <h3 className="font-bold text-base flex-grow truncate">{product.name}</h3>
          <Badge variant="outline" className={cn(
            "bg-soft-green text-green-800 border-0 shrink-0",
            product.stock < 5 && "bg-soft-yellow text-yellow-800",
            product.stock < 2 && "bg-soft-orange text-orange-800"
          )}>
            <Package className="h-3 w-3 mr-1" /> {product.stock}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="bg-slate-50 p-2">
        <div className="flex justify-between items-center w-full space-x-2">
          <span className="font-bold text-lg truncate">{formatCurrency(product.price)}</span>
          
          {onBarberSelect && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-soft-blue hover:bg-blue-200 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBarberSelect(product);
                  }}
                >
                  <User className="h-4 w-4 text-blue-700" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                <span className="text-xs">{getText("Asignar barbero", "Assign barber")}</span>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCardItem;
