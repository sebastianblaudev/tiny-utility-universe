
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Receipt, X, Check } from 'lucide-react';
import { verifySIIStatus } from '@/utils/siiChileUtils';

interface SIIStatusChipProps {
  saleId: string;
}

const SIIStatusChip: React.FC<SIIStatusChipProps> = ({ saleId }) => {
  const [status, setStatus] = useState<{
    checked: boolean;
    sent: boolean;
    folio?: string;
  }>({
    checked: false,
    sent: false
  });
  
  useEffect(() => {
    const checkStatus = async () => {
      const result = await verifySIIStatus(saleId);
      setStatus({
        checked: true,
        sent: result.sent,
        folio: result.folio
      });
    };
    
    if (saleId) {
      checkStatus();
    }
  }, [saleId]);
  
  if (!status.checked) {
    return (
      <Badge variant="outline" className="gap-1 ml-2">
        <Receipt className="h-3 w-3" />
        <span>SII: Verificando...</span>
      </Badge>
    );
  }
  
  if (status.sent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="success" className="gap-1 ml-2">
            <Check className="h-3 w-3" />
            <span>SII: Enviado</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Documento enviado a SII</p>
          {status.folio && <p className="font-medium">Folio: {status.folio}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className="gap-1 ml-2">
          <X className="h-3 w-3" />
          <span>SII: Pendiente</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Documento pendiente de envío a SII</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SIIStatusChip;
