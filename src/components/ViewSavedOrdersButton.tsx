
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useContext } from "react";
import { TableOrderContext } from "@/contexts/TableOrderContext";

export function ViewSavedOrdersButton() {
  // Get the context but don't throw an error if it's not available
  const context = useContext(TableOrderContext);
  
  // If context is not available, don't render the button
  if (!context) {
    return null;
  }
  
  const { showSavedOrdersDialog } = context;

  return (
    <Button 
      size="sm" 
      variant="outline"
      className="ml-2 flex items-center bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-white"
      onClick={showSavedOrdersDialog}
    >
      <Clock className="mr-1 h-4 w-4" />
      Ver órdenes guardadas
    </Button>
  );
}
