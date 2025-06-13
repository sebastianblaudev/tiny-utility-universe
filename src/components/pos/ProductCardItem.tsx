
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, User, ShoppingBag } from 'lucide-react';
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

  const getStockColor = () => {
    if (product.stock >= 5) return "from-green-100 to-emerald-100 text-green-700";
    if (product.stock >= 2) return "from-yellow-100 to-amber-100 text-yellow-700";
    return "from-red-100 to-rose-100 text-red-700";
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer h-full transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden group",
        selected && "ring-2 ring-blue-500 shadow-2xl scale-105"
      )}
      onClick={() => onAddToCart(product)}
    >
      <CardContent className="p-4 pb-2">
        <div className="flex justify-between items-start space-x-3">
          <div className="flex-1">
            <h3 className="font-bold text-base text-slate-800 group-hover:text-slate-900 transition-colors duration-200 leading-tight">{product.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-1.5 rounded-xl">
              <ShoppingBag className="h-3 w-3 text-orange-600" />
            </div>
            <Badge className={`bg-gradient-to-r border-0 text-xs font-medium ${getStockColor()}`}>
              <Package className="h-3 w-3 mr-1" /> 
              {product.stock}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gradient-to-r from-slate-50 to-white p-4 border-t border-slate-100/50">
        <div className="flex justify-between items-center w-full">
          <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            {formatCurrency(product.price)}
          </span>
          
          {onBarberSelect && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50 transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBarberSelect(product);
                  }}
                >
                  <User className="h-4 w-4 text-blue-600" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-3 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-xl">
                <span className="text-xs font-medium">{getText("Asignar barbero", "Assign barber")}</span>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCardItem;
