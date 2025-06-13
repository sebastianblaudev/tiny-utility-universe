
import { useState, useEffect } from 'react';

interface LanguageCurrencyConfig {
  language: 'es' | 'en';
  currency: 'COP' | 'USD' | 'EUR' | 'MXN' | 'CLP';
  decimals: 0 | 2;
}

const DEFAULT_CONFIG: LanguageCurrencyConfig = {
  language: 'es',
  currency: 'COP',
  decimals: 0
};

export const useLanguageCurrency = () => {
  const [config, setConfig] = useState<LanguageCurrencyConfig>(DEFAULT_CONFIG);

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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(config.language === 'es' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  };

  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat(config.language === 'es' ? 'es-CO' : 'en-US', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  };

  const getText = (esText: string, enText: string): string => {
    return config.language === 'es' ? esText : enText;
  };

  return {
    config,
    formatCurrency,
    formatNumber,
    getText,
    isSpanish: config.language === 'es',
    isEnglish: config.language === 'en'
  };
};
