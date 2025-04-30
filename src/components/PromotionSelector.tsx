
import { useState, useEffect } from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, Percent, Gift, ShoppingCart, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Promotion } from '@/lib/db';

interface PromotionSelectorProps {
  cart: any[];
  onApplyPromotion: (discount: number, promotion: Promotion | null) => void;
}

export function PromotionSelector({ cart, onApplyPromotion }: PromotionSelectorProps) {
  const { 
    activePromotions, 
    validatePromoCode, 
    calculateBestDiscount,
    isLoading
  } = usePromotions();
  
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  
  // Calculate best discount whenever cart or applied promo code changes
  useEffect(() => {
    if (cart.length > 0) {
      const fetchDiscount = async () => {
        try {
          const result = await calculateBestDiscount(cart, appliedPromoCode);
          setCalculationResult(result);
          onApplyPromotion(result.discount, result.appliedPromotion);
        } catch (error) {
          console.error("Error calculating discount:", error);
          setCalculationResult(null);
          onApplyPromotion(0, null);
        }
      };
      
      fetchDiscount();
    } else {
      setCalculationResult(null);
      onApplyPromotion(0, null);
    }
  }, [cart, appliedPromoCode, calculateBestDiscount, onApplyPromotion]);
  
  // Apply promo code function
  const applyPromoCode = async () => {
    if (!promoCode) return;
    
    const validPromo = await validatePromoCode(promoCode);
    if (validPromo) {
      setAppliedPromoCode(promoCode);
      setPromoCode('');
    } else {
      setAppliedPromoCode(null);
    }
  };
  
  // Clear applied promo code
  const clearPromoCode = () => {
    setAppliedPromoCode(null);
  };
  
  // Get icon for promotion type
  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4 text-orange-500" />;
      case 'fixed':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'bogo':
        return <Gift className="h-4 w-4 text-pink-500" />;
      case 'bundle':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };
  
  // Format value for display
  const formatPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}% de descuento`;
    } else if (promotion.type === 'bogo') {
      return promotion.value === 100 
        ? "2x1"
        : `${promotion.value}% en el 2do producto`;
    } else {
      return `$${promotion.value.toFixed(2)} de descuento`;
    }
  };

  if (isLoading) return null;
  
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <Popover open={showPopover} onOpenChange={setShowPopover}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-[#1A1A1A] hover:bg-[#252525] border-[#333333]"
            >
              <Tag className="h-4 w-4 mr-2" />
              Promociones
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#111111] border-[#333333] text-white p-0">
            <div className="p-4">
              <h4 className="font-medium mb-2">Promociones disponibles</h4>
              
              {activePromotions.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {activePromotions.map((promotion) => (
                    <div 
                      key={promotion.id} 
                      className="flex items-center justify-between p-2 border border-[#333333] rounded hover:border-orange-500 cursor-pointer"
                      onClick={() => {
                        // If promotion has a code, apply that code
                        if (promotion.code) {
                          setAppliedPromoCode(promotion.code);
                        } else {
                          // Just close the popover to use auto-selected best promotion
                          setShowPopover(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {getPromotionIcon(promotion.type)}
                        <div>
                          <p className="text-sm font-medium">{promotion.name}</p>
                          <p className="text-xs text-gray-400">{formatPromotionValue(promotion)}</p>
                        </div>
                      </div>
                      {calculationResult?.appliedPromotion?.id === promotion.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No hay promociones activas</p>
              )}
              
              <div className="mt-4 pt-4 border-t border-[#333333]">
                <div className="flex gap-2">
                  <Input
                    placeholder="Código promocional"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="bg-[#1A1A1A] border-[#333333]"
                  />
                  <Button 
                    onClick={applyPromoCode}
                    className="bg-gradient-to-r from-orange-400 to-orange-600"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {appliedPromoCode && (
          <Badge variant="outline" className="bg-orange-800/20 border-orange-500 flex items-center">
            Código: {appliedPromoCode}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-1"
              onClick={clearPromoCode}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {calculationResult?.appliedPromotion && (
          <Badge 
            variant="outline" 
            className="bg-green-800/20 border-green-500 flex items-center gap-1"
          >
            {getPromotionIcon(calculationResult.appliedPromotion.type)}
            {calculationResult.appliedPromotion.name} (-${calculationResult.discount.toFixed(2)})
          </Badge>
        )}
      </div>
    </div>
  );
}
