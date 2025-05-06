
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useTableOrder } from "@/contexts/TableOrderContext";

export function ViewSavedOrdersButton() {
  const { showSavedOrdersDialog } = useTableOrder();

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
