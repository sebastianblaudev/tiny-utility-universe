
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTurnoActivo, saveCashierInfo, clearCashierInfo, getTurnoById, getTurnoSalesByPaymentMethod } from '@/utils/turnosUtils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useTurnoIntegration() {
  const { tenantId } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check for active turno
  useEffect(() => {
    if (tenantId) {
      checkActiveShift();
    }
  }, [tenantId]);

  const checkActiveShift = async () => {
    setLoading(true);
    try {
      const turno = await getTurnoActivo(tenantId || '');
      setActiveShift(turno);
      
      // If there's an active shift, ensure cashier info is saved in session
      if (turno) {
        saveCashierInfo(turno.cajero_nombre, turno.fecha_apertura);
      }
    } catch (error) {
      console.error("Error checking active shift:", error);
    } finally {
      setLoading(false);
    }
  };

  const requireActiveShift = (action: () => void) => {
    if (!activeShift) {
      toast.error("Necesitas abrir un turno primero", {
        description: "Para realizar ventas, debes tener un turno abierto",
        action: {
          label: "Abrir Turno",
          onClick: () => navigate('/gestion')
        }
      });
      return;
    }
    
    action();
  };
  
  const getShiftDetails = async (shiftId: string) => {
    if (!shiftId) return null;
    try {
      return await getTurnoById(shiftId);
    } catch (error) {
      console.error("Error getting shift details:", error);
      return null;
    }
  };
  
  const getShiftSalesByPaymentMethod = async (shiftId: string) => {
    if (!shiftId) return {};
    try {
      return await getTurnoSalesByPaymentMethod(shiftId);
    } catch (error) {
      console.error("Error getting shift sales by payment method:", error);
      return {};
    }
  };

  return {
    activeShift,
    loading,
    checkActiveShift,
    requireActiveShift,
    getShiftDetails,
    getShiftSalesByPaymentMethod
  };
}

export default useTurnoIntegration;
