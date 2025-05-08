
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useContext } from "react";
import { TableOrderContext, useTableOrder } from "@/contexts/TableOrderContext";
import { toast } from "@/hooks/use-toast";

export function ViewSavedOrdersButton({ className = "" }) {
  // Try to access the context using the custom hook first, fall back to useContext if needed
  let tableOrderFunctions;
  
  try {
    // First try using the custom hook
    tableOrderFunctions = useTableOrder();
  } catch (error) {
    // If the hook fails, try using the plain context
    tableOrderFunctions = useContext(TableOrderContext);
  }
  
  const handleClick = () => {
    console.log("Button clicked, context:", tableOrderFunctions);
    // Check if the context and the function are available
    if (tableOrderFunctions && typeof tableOrderFunctions.showSavedOrdersDialog === 'function') {
      console.log("Opening saved orders dialog");
      tableOrderFunctions.showSavedOrdersDialog();
    } else {
      console.log("TableOrderContext not available or showSavedOrdersDialog not found", tableOrderFunctions);
      // Show a toast message for feedback
      toast({
        title: "No disponible",
        description: "La función de órdenes guardadas no está disponible en este contexto",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline"
      className={`flex items-center bg-[#1A1A1A] border-zinc-700 hover:bg-[#252525] hover:border-orange-500/30 text-white ${className}`}
      onClick={handleClick}
    >
      <Clock className="mr-1 h-4 w-4" />
      Ver órdenes guardadas
    </Button>
  );
}
