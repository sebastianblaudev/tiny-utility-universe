
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";

interface TaxSettingsFormValues {
  taxEnabled: boolean;
  taxPercentage: string;
}

export function TaxSettings() {
  const form = useForm<TaxSettingsFormValues>({
    defaultValues: {
      taxEnabled: true,
      taxPercentage: "16"
    }
  });

  useEffect(() => {
    // Load saved settings from localStorage if they exist
    try {
      const savedSettings = localStorage.getItem("taxSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        form.reset(parsedSettings);
      }
    } catch (error) {
      console.error("Error loading tax settings:", error);
    }
  }, [form]);

  const onSubmit = (data: TaxSettingsFormValues) => {
    try {
      // Save settings to localStorage
      localStorage.setItem("taxSettings", JSON.stringify(data));
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
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Configuración de Impuestos</CardTitle>
        <CardDescription className="text-white">
          Configura el porcentaje de impuesto y actívalo o desactívalo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="taxEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg p-4 border border-zinc-800">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white">Activar Impuesto</FormLabel>
                      <FormDescription className="text-zinc-400">
                        Habilitar o deshabilitar el cálculo de impuestos en los recibos.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="taxPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Porcentaje de Impuesto (%)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="16" 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100" 
                      {...field}
                      disabled={!form.watch("taxEnabled")}
                      className="bg-[#2A2A2A] text-white border-zinc-700" 
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-400">
                    Establece el porcentaje de impuesto que se aplicará a las ventas.
                  </FormDescription>
                </FormItem>
              )}
            />

            <button 
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Guardar Configuración
            </button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
