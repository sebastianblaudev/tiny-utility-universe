
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, DollarSign, Banknote, CreditCard } from "lucide-react";
import { useBarber } from "@/contexts/BarberContext";
import { CashAdvance } from "@/types";
import NewAdvanceDialog from "@/components/advances/NewAdvanceDialog";
import SettleAdvanceDialog from "@/components/advances/SettleAdvanceDialog";

const AdvancesPage = () => {
  const { cashAdvances, getCashAdvancesWithBarberNames, updateCashAdvanceStatus } = useBarber();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isNewAdvanceDialogOpen, setIsNewAdvanceDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<CashAdvance | null>(null);
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  
  const advancesWithNames = getCashAdvancesWithBarberNames();
  
  // Filter advances based on search query and status
  const filteredAdvances = advancesWithNames.filter(advance => {
    const matchesSearch = 
      advance.barberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advance.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === null || advance.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate totals
  const totalPendingAmount = advancesWithNames
    .filter(advance => advance.status === "pending" || !advance.status)
    .reduce((total, advance) => total + advance.amount, 0);
    
  const totalSettledAmount = advancesWithNames
    .filter(advance => advance.status === "settled")
    .reduce((total, advance) => total + advance.amount, 0);

  const handleOpenSettleDialog = (advance: CashAdvance) => {
    setSelectedAdvance(advance);
    setIsSettleDialogOpen(true);
  };

  const handleSettleAdvance = (id: string) => {
    updateCashAdvanceStatus(id, 'settled');
  };

  // Helper function to get payment method label and icon
  const getPaymentMethodDisplay = (paymentMethod: 'cash' | 'transfer') => {
    return {
      cash: { 
        label: "Efectivo", 
        icon: <Banknote className="h-4 w-4 mr-1" /> 
      },
      transfer: { 
        label: "Transferencia", 
        icon: <CreditCard className="h-4 w-4 mr-1" /> 
      }
    }[paymentMethod];
  };

  // Helper function to safely format date
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    
    try {
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Adelantos</h1>
        <Button 
          className="bg-barber-600 hover:bg-barber-700"
          onClick={() => setIsNewAdvanceDialogOpen(true)}
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Nuevo Adelanto
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-barber-600 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Adelantos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalPendingAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Aún no devueltos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-600 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Adelantos Liquidados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSettledAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Ya devueltos</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Historial de Adelantos</CardTitle>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mt-2">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Buscar por nombre o razón..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button type="submit" size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === null ? "default" : "outline"}
                onClick={() => setStatusFilter(null)}
                className={statusFilter === null ? "bg-barber-600" : ""}
              >
                Todos
              </Button>
              <Button 
                variant={statusFilter === "settled" ? "default" : "outline"}
                onClick={() => setStatusFilter("settled")}
                className={statusFilter === "settled" ? "bg-barber-600" : ""}
              >
                Liquidados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barbero</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay adelantos que coincidan con el filtro actual
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvances.map((advance) => {
                  const paymentMethod = getPaymentMethodDisplay(advance.paymentMethod || 'cash');
                  return (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">{advance.barberName}</TableCell>
                      <TableCell>${advance.amount.toFixed(2)}</TableCell>
                      <TableCell>{formatDate(advance.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {paymentMethod.icon}
                          <span>{paymentMethod.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>{advance.description}</TableCell>
                      <TableCell>
                        <Badge variant={(advance.status === "pending" || !advance.status) ? "destructive" : "success"}>
                          {(advance.status === "pending" || !advance.status) ? "Pendiente" : "Liquidado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(advance.status === "pending" || !advance.status) && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600"
                            onClick={() => handleOpenSettleDialog(advance)}
                          >
                            Marcar como Liquidado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <NewAdvanceDialog 
        isOpen={isNewAdvanceDialogOpen} 
        onClose={() => setIsNewAdvanceDialogOpen(false)} 
      />
      
      <SettleAdvanceDialog 
        isOpen={isSettleDialogOpen}
        onClose={() => setIsSettleDialogOpen(false)}
        advance={selectedAdvance}
        onSettle={handleSettleAdvance}
      />
    </div>
  );
};

export default AdvancesPage;
