import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Languages, DollarSign } from "lucide-react";

interface LanguageCurrencyConfig {
  language: 'es' | 'en';
  currency: 'COP' | 'USD' | 'EUR' | 'MXN' | 'CLP';
  decimals: 0 | 2;
}

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' }
];

const CURRENCIES = [
  { value: 'COP', label: 'Peso Colombiano (COP)', decimals: 0 },
  { value: 'USD', label: 'Dólar Americano (USD)', decimals: 2 },
  { value: 'EUR', label: 'Euro (EUR)', decimals: 2 },
  { value: 'MXN', label: 'Peso Mexicano (MXN)', decimals: 2 },
  { value: 'CLP', label: 'Peso Chileno (CLP)', decimals: 0 }
];

const LanguageCurrencySettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<LanguageCurrencyConfig>({
    language: 'es',
    currency: 'COP',
    decimals: 0
  });

  // Load configuration from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('languageCurrencyConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved configuration:', error);
      }
    }
  }, []);

  const handleLanguageChange = (language: 'es' | 'en') => {
    setConfig(prev => ({ ...prev, language }));
  };

  const handleCurrencyChange = (currency: string) => {
    const selectedCurrency = CURRENCIES.find(c => c.value === currency);
    if (selectedCurrency) {
      setConfig(prev => ({ 
        ...prev, 
        currency: currency as 'COP' | 'USD' | 'EUR' | 'MXN' | 'CLP',
        decimals: selectedCurrency.decimals as 0 | 2
      }));
    }
  };

  const saveConfiguration = () => {
    try {
      localStorage.setItem('languageCurrencyConfig', JSON.stringify(config));
      toast({
        title: config.language === 'es' ? "Configuración guardada" : "Configuration saved",
        description: config.language === 'es' 
          ? "Los cambios se han aplicado correctamente" 
          : "Changes have been applied successfully"
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: config.language === 'es' ? "Error" : "Error",
        description: config.language === 'es' 
          ? "No se pudo guardar la configuración" 
          : "Could not save configuration",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(config.language === 'es' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages size={20} />
            {config.language === 'es' ? 'Idioma' : 'Language'}
          </CardTitle>
          <CardDescription>
            {config.language === 'es' 
              ? 'Selecciona el idioma de la aplicación'
              : 'Select the application language'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">
              {config.language === 'es' ? 'Idioma' : 'Language'}
            </Label>
            <Select value={config.language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder={config.language === 'es' ? 'Seleccionar idioma' : 'Select language'} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} />
            {config.language === 'es' ? 'Moneda' : 'Currency'}
          </CardTitle>
          <CardDescription>
            {config.language === 'es' 
              ? 'Configura la moneda y formato de números'
              : 'Configure currency and number format'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">
              {config.language === 'es' ? 'Moneda' : 'Currency'}
            </Label>
            <Select value={config.currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue placeholder={config.language === 'es' ? 'Seleccionar moneda' : 'Select currency'} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {config.language === 'es' ? 'Decimales' : 'Decimals'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {config.decimals} {config.language === 'es' ? 'decimales' : 'decimals'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              {config.language === 'es' ? 'Vista previa' : 'Preview'}
            </Label>
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {formatCurrency(12345.67)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button onClick={saveConfiguration} className="w-full">
            {config.language === 'es' ? 'Guardar Configuración' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageCurrencySettings;
