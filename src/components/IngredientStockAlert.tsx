
import React, { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Bell, InfoIcon, PackageMinus, PackagePlus, List } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Ingredient = {
  id: string;
  name: string;
  stock: number;
};

interface IngredientStockAlertProps {
  threshold?: number; // Percentage threshold for low stock warning (default 20%)
  criticalThreshold?: number; // Percentage threshold for critical stock warning (default 10%)
  showProgress?: boolean;
}

export const IngredientStockAlert: React.FC<IngredientStockAlertProps> = ({
  threshold = 20,
  criticalThreshold = 10,
  showProgress = true,
}) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStockIngredients, setLowStockIngredients] = useState<Ingredient[]>([]);
  
  // Load ingredients from localStorage
  useEffect(() => {
    const loadIngredients = () => {
      try {
        const stored = localStorage.getItem("ingredients");
        if (stored) {
          const parsedIngredients = JSON.parse(stored);
          setIngredients(parsedIngredients);
          
          // Find ingredients with low stock
          const lowStock = parsedIngredients.filter((ing: Ingredient) => {
            // If no stock value is set, we consider it as low stock
            if (ing.stock === undefined) return true;
            
            // Check if stock is below threshold (20% by default)
            return ing.stock <= 200; // Threshold for low stock in grams
          });
          
          setLowStockIngredients(lowStock);
          
          // Show notification for low stock ingredients
          if (lowStock.length > 0) {
            toast({
              title: "Alerta de ingredientes",
              description: `${lowStock.length} ingredientes tienen stock bajo`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error loading ingredients for stock alert:", error);
      }
    };
    
    loadIngredients();
    
    // Set up a timer to check stock periodically
    const intervalId = setInterval(() => {
      loadIngredients();
    }, 300000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (lowStockIngredients.length === 0) {
    return null;
  }
  
  // Function to determine stock level status and color
  const getStockStatus = (stock: number) => {
    if (stock <= 100) return { status: "Crítico", color: "bg-red-500", textColor: "text-red-500" };
    if (stock <= 200) return { status: "Bajo", color: "bg-yellow-500", textColor: "text-yellow-500" };
    return { status: "Normal", color: "bg-green-500", textColor: "text-green-500" };
  };
  
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="border-red-500 bg-red-500/10">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-red-500">Alerta de stock</AlertTitle>
        <AlertDescription>
          {lowStockIngredients.length} ingredientes tienen stock bajo y requieren reposición.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
        {lowStockIngredients.map((ingredient) => {
          const stockStatus = getStockStatus(ingredient.stock || 0);
          
          return (
            <div key={ingredient.id} className="flex items-center justify-between bg-black rounded-lg p-3 border border-neutral-800">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ingredient.name}</span>
                  <Badge variant={ingredient.stock <= 100 ? "destructive" : "outline"} className="text-xs">
                    {stockStatus.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Stock actual: <span className={stockStatus.textColor}>{ingredient.stock || 0}g</span>
                </div>
              </div>
              
              {showProgress && (
                <div className="w-1/3">
                  <Progress 
                    value={ingredient.stock || 0} 
                    max={1000} 
                    className="h-2"
                    // Background and foreground colors based on stock level
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div 
                      className={`h-full ${stockStatus.color}`} 
                      style={{ width: `${Math.min(100, ((ingredient.stock || 0) / 1000) * 100)}%` }} 
                    />
                  </Progress>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
