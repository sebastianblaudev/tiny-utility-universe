
import React from 'react';
import { 
  ServiceCard, 
  ServiceCardHeader, 
  ServiceCardContent, 
  ServiceCardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Sparkles } from 'lucide-react';
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
        "cursor-pointer h-full transition-all duration-300 shadow-lg hover:shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden group",
        selected && "ring-2 ring-blue-500 shadow-2xl scale-105"
      )}
      onClick={() => onAddToCart(service)}
    >
      <ServiceCardHeader className="pb-3 p-4">
        <div className="flex justify-between items-start space-x-3">
          <div className="flex-1">
            <h3 className="font-bold text-base text-slate-800 group-hover:text-slate-900 transition-colors duration-200 leading-tight">{service.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-1.5 rounded-xl">
              <Sparkles className="h-3 w-3 text-blue-600" />
            </div>
            {service.barberId && assignedBarber && (
              <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-0 text-xs font-medium">
                <User className="h-3 w-3 mr-1" /> 
                {assignedBarber.name}
              </Badge>
            )}
          </div>
        </div>
      </ServiceCardHeader>
      
      <ServiceCardContent className="px-4 pb-2">
        <div className="flex items-center gap-2 text-slate-600">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium">{service.duration} {getText("min.", "min.")}</span>
        </div>
      </ServiceCardContent>
      
      <ServiceCardFooter className="bg-gradient-to-r from-slate-50 to-white p-4 border-t border-slate-100/50">
        <div className="flex justify-between items-center w-full">
          <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            {formatCurrency(service.price)}
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
                    onBarberSelect(service);
                  }}
                >
                  <User className="h-4 w-4 text-blue-600" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-3 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-xl">
                <span className="text-xs font-medium">
                  {service.barberId ? 
                    getText("Cambiar barbero", "Change barber") : 
                    getText("Asignar barbero", "Assign barber")
                  }
                </span>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </ServiceCardFooter>
    </ServiceCard>
  );
};

export default ServiceCardItem;
