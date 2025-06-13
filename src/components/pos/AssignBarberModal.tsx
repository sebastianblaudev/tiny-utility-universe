
import { useState, useEffect } from "react";
import { useBarber } from "@/contexts/BarberContext";
import { Service, Barber } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface AssignBarberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onBarberSelected: (service: Service, barberId: string) => void;
}

const AssignBarberModal = ({ 
  open, 
  onOpenChange, 
  service, 
  onBarberSelected 
}: AssignBarberModalProps) => {
  const { barbers } = useBarber();
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const filteredBarbers = barbers.filter(barber => barber && barber.id && barber.name);
  
  // Reset selected barber when modal opens with a new service
  useEffect(() => {
    if (open && service) {
      setSelectedBarberId(service.barberId || "");
    }
  }, [open, service]);
  
  const handleConfirm = () => {
    if (service && selectedBarberId) {
      onBarberSelected(service, selectedBarberId);
      onOpenChange(false);
    }
  };
  
  if (!service) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Asignar barbero para {service.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {filteredBarbers.length > 0 ? (
            <RadioGroup 
              value={selectedBarberId} 
              onValueChange={setSelectedBarberId}
              className="space-y-2"
            >
              {filteredBarbers.map(barber => (
                <div 
                  key={barber.id}
                  className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedBarberId(barber.id)}
                >
                  <RadioGroupItem value={barber.id} id={`barber-${barber.id}`} />
                  <Label 
                    htmlFor={`barber-${barber.id}`}
                    className="flex-grow cursor-pointer font-medium"
                  >
                    {barber.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay barberos disponibles
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedBarberId}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignBarberModal;
