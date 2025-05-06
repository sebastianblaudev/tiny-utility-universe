
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type LocaleSettings = {
  language: string;
  country: string;
};

const countries = [
  { code: 'AR', name: 'Argentina', decimal: ',', thousands: '.' },
  { code: 'CL', name: 'Chile', decimal: ',', thousands: '.' },
  { code: 'MX', name: 'México', decimal: '.', thousands: ',' },
  { code: 'US', name: 'Estados Unidos', decimal: '.', thousands: ',' },
  { code: 'CR', name: 'Costa Rica', decimal: '.', thousands: ',' },
];

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

export const LocaleSettings = () => {
  const { toast } = useToast();
  const form = useForm<LocaleSettings>({
    defaultValues: {
      language: 'es',
      country: 'AR'
    }
  });

  React.useEffect(() => {
    const savedSettings = localStorage.getItem("localeSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        form.reset(settings);
      } catch (error) {
        console.error("Error loading locale settings:", error);
      }
    }
  }, [form]);

  const onSubmit = async (data: LocaleSettings) => {
    try {
      localStorage.setItem("localeSettings", JSON.stringify(data));
      toast({
        title: "Configuración guardada",
        description: "La configuración regional se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Configuración Regional</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idioma</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button type="submit">
            Guardar configuración
          </Button>
        </form>
      </Form>
    </div>
  );
};
