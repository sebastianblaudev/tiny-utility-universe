import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { initDB } from "@/lib/db";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TaxSettings() {
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  // Load tax settings when component mounts
  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        // Try to load from IndexedDB first
        const db = await initDB();
        const taxSettings = await db.get('business', 'taxSettings');
        
        if (taxSettings) {
          setTaxEnabled(taxSettings.taxEnabled || false);
          setTaxPercentage(taxSettings.taxPercentage || "0");
        } else {
          // Fall back to localStorage for backward compatibility
          const savedSettings = localStorage.getItem("taxSettings");
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setTaxEnabled(parsed.taxEnabled || false);
            setTaxPercentage(parsed.taxPercentage || "0");
          }
        }
      } catch (error) {
        console.error("Error loading tax settings:", error);
      }
    };
    
    loadTaxSettings();
  }, []);

  const saveTaxSettings = async () => {
    try {
      setIsLoading(true);
      
      // Format the data for saving
      const formattedData = {
        id: 'taxSettings',
        taxEnabled,
        taxPercentage
      };
      
      // Save settings to IndexedDB
      const db = await initDB();
      await db.put('business', formattedData);
      
      // Keep localStorage for backward compatibility
      localStorage.setItem("taxSettings", JSON.stringify({
        taxEnabled,
        taxPercentage
      }));
      
      console.log("Tax settings saved:", formattedData);
      
      // Dispatch a custom event to notify other components of tax settings change
      window.dispatchEvent(new CustomEvent('taxSettingsChanged', { 
        detail: {
          taxEnabled,
          taxPercentage
        }
      }));
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de impuestos ha sido actualizada."
      });
    } catch (error) {
      console.error("Error saving tax settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableTaxesCompletely = async () => {
    try {
      setIsLoading(true);
      // Disable taxes completely in the system
      const formattedData = {
        id: 'taxSettings',
        taxEnabled: false,
        taxPercentage: "0"
      };
      
      // Save settings to IndexedDB
      const db = await initDB();
      await db.put('business', formattedData);
      
      // Keep localStorage for backward compatibility
      localStorage.setItem("taxSettings", JSON.stringify({
        taxEnabled: false,
        taxPercentage: "0"
      }));
      
      // Update local state
      setTaxEnabled(false);
      setTaxPercentage("0");
      
      console.log("Tax settings disabled completely:", formattedData);
      
      // Dispatch a custom event to notify other components of tax settings change
      window.dispatchEvent(new CustomEvent('taxSettingsChanged', { 
        detail: {
          taxEnabled: false,
          taxPercentage: "0"
        }
      }));
      
      toast({
        title: "Impuestos desactivados",
        description: "Los impuestos han sido desactivados en todo el sistema."
      });
    } catch (error) {
      console.error("Error saving tax settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Impuestos</CardTitle>
        <CardDescription className="text-white">
          Configuración de IVA y otros impuestos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="tax-enabled" className="text-white">Activar IVA</Label>
            <Switch 
              id="tax-enabled" 
              checked={taxEnabled}
              onCheckedChange={setTaxEnabled}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="tax-percentage" className="text-white">Porcentaje de IVA (%)</Label>
            <Input
              id="tax-percentage"
              type="number"
              min="0"
              max="100"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(e.target.value)}
              disabled={!taxEnabled}
              className="bg-zinc-800 text-white border-zinc-700"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={saveTaxSettings}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              Guardar configuración
            </Button>
            
            <Button 
              onClick={disableTaxesCompletely}
              className="bg-zinc-700 hover:bg-zinc-600 text-white"
              disabled={isLoading}
            >
              Forzar desactivación de impuestos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
