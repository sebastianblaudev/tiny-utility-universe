
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBarber } from "@/contexts/BarberContext";
import { Download, Upload, HardDrive } from "lucide-react";

const DataBackupComponent = () => {
  const { toast } = useToast();
  const barberContext = useBarber();
  
  // Recopila todos los datos a exportar
  const getAllData = () => {
    const data = {
      appSettings: barberContext.appSettings,
      barbers: barberContext.barbers,
      services: barberContext.services,
      products: barberContext.products,
      categories: barberContext.categories,
      sales: barberContext.sales,
      cashAdvances: barberContext.cashAdvances,
      exportDate: new Date().toISOString()
    };
    return data;
  };
  
  const handleExport = () => {
    try {
      const data = getAllData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `barbershop-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "Éxito",
        description: "Los datos se han exportado correctamente",
      });
    } catch (error) {
      console.error('Error al exportar datos:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al exportar los datos",
        variant: "destructive"
      });
    }
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          // Importar cada tipo de dato (simplified without branches)
          if (data.categories) barberContext.categories.forEach(c => barberContext.deleteCategory(c.id));
          if (data.categories) data.categories.forEach((category: any) => barberContext.addCategory(category));
          
          if (data.barbers) barberContext.barbers.forEach(b => barberContext.deleteBarber(b.id));
          if (data.barbers) data.barbers.forEach((barber: any) => barberContext.addBarber(barber));
          
          if (data.services) barberContext.services.forEach(s => barberContext.deleteService(s.id));
          if (data.services) data.services.forEach((service: any) => barberContext.addService(service));
          
          if (data.products) barberContext.products.forEach(p => barberContext.deleteProduct(p.id));
          if (data.products) data.products.forEach((product: any) => barberContext.addProduct(product));
          
          if (data.sales) data.sales.forEach((sale: any) => {
            if (!barberContext.sales.some(s => s.id === sale.id)) {
              barberContext.addSale(sale);
            }
          });
          
          if (data.cashAdvances) data.cashAdvances.forEach((advance: any) => {
            if (!barberContext.cashAdvances.some(a => a.id === advance.id)) {
              barberContext.addCashAdvance(advance);
            }
          });
          
          toast({
            title: "Éxito",
            description: "Los datos se han importado correctamente",
          });
        } catch (error) {
          console.error('Error al importar datos:', error);
          toast({
            title: "Error",
            description: "Ha ocurrido un error al importar los datos",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Respaldo de Datos</CardTitle>
        <CardDescription>
          Exporta o importa los datos de tu barbería para hacer un respaldo o transferirlos a otro dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={handleExport} className="w-full flex items-center gap-2">
            <Download size={18} />
            Exportar datos
          </Button>
          <Button onClick={handleImport} variant="outline" className="w-full flex items-center gap-2">
            <Upload size={18} />
            Importar datos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataBackupComponent;
