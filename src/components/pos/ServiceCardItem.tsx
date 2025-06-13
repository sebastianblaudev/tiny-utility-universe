
import React from 'react';
import { 
  ServiceCard, 
  ServiceCardHeader, 
  ServiceCardContent, 
  ServiceCardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { Service } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useBarber } from '@/contexts/BarberContext';
import { useLanguageCurrency } from '@/hooks/useLanguageCurrency';

interface ServiceCardItemProps {
  service: Service;
  onAddToCart: (service: Service) => void;
  onBarberSelect?: (service: Service) => void;
  selected?: boolean;
}

const ServiceCardItem: React.FC<ServiceCardItemProps> = ({ 
  service, 
  onAddToCart, 
  onBarberSelect,
  selected = false 
}) => {
  const { barbers } = useBarber();
  const { formatCurrency, getText } = useLanguageCurrency();
  
  const realBarbers = barbers.filter(barber => barber && barber.id && barber.name);
  const assignedBarber = service.barberId ? 
    realBarbers.find(b => b.id === service.barberId) : null;

  return (
    <ServiceCard 
      className={cn(
        "cursor-pointer h-full transition-all shadow-sm hover:shadow-md",
        selected && "ring-2 ring-barber-500 bg-barber-50"
      )}
      onClick={() => onAddToCart(service)}
    >
      <ServiceCardHeader className="pb-2">
        <div className="flex justify-between items-start space-x-2">
          <h3 className="font-bold text-base flex-grow truncate">{service.name}</h3>
          {service.barberId && assignedBarber && (
            <Badge variant="outline" className="bg-soft-purple text-purple-800 border-0 shrink-0">
              <User className="h-3 w-3 mr-1" /> {assignedBarber.name}
            </Badge>
          )}
        </div>
      </ServiceCardHeader>
      
      <ServiceCardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">{service.duration} {getText("min.", "min.")}</span>
        </div>
      </ServiceCardContent>
      
      <ServiceCardFooter className="bg-slate-50 p-2">
        <div className="flex justify-between items-center w-full space-x-2">
          <span className="font-bold text-lg truncate">{formatCurrency(service.price)}</span>
          
          {onBarberSelect && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-soft-blue hover:bg-blue-200 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBarberSelect(service);
                  }}
                >
                  <User className="h-4 w-4 text-blue-700" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2">
                {service.barberId ? 
                  <span className="text-xs">{getText("Cambiar barbero", "Change barber")}</span> : 
                  <span className="text-xs">{getText("Asignar barbero", "Assign barber")}</span>
                }
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </ServiceCardFooter>
    </ServiceCard>
  );
};

export default ServiceCardItem;
