import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoConfiguration {
  accessToken: string;
  publicKey: string;
  enabledPaymentMethods: {
    cash: boolean;
    card: boolean;
    transfer: boolean;
  };
  autoSync: boolean;
  environment: 'sandbox' | 'production';
}

interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  description: string;
  saleId: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  externalId?: string;
}

export const useMercadoPagoIntegration = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [configuration, setConfiguration] = useState<MercadoPagoConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('plugin_configurations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'mercado_pago_pos')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.configuration) {
        setConfiguration(data.configuration as unknown as MercadoPagoConfiguration);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Error loading Mercado Pago configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const logTransaction = async (
    transactionType: string,
    saleId: string,
    amount: number,
    status: string,
    externalId?: string,
    error?: string
  ) => {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      const { error: logError } = await supabase
        .from('plugin_transaction_logs')
        .insert({
          tenant_id: tenantId,
          plugin_key: 'mercado_pago_pos',
          transaction_type: transactionType,
          external_transaction_id: externalId,
          internal_sale_id: saleId,
          amount,
          status,
          error_message: error,
          request_data: { saleId, amount, transactionType },
          response_data: { externalId, status }
        });

      if (logError) {
        console.error('Error logging transaction:', logError);
      }
    } catch (error) {
      console.error('Error in logTransaction:', error);
    }
  };

  const processPayment = async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
    if (!isConfigured || !configuration) {
      return {
        success: false,
        error: 'Mercado Pago no está configurado'
      };
    }

    try {
      // Log the transaction attempt
      await logTransaction(
        'sale',
        paymentRequest.saleId,
        paymentRequest.amount,
        'pending'
      );

      // In a real implementation, this would call the Mercado Pago API
      // For now, we'll simulate the API call
      const mockResponse = await simulateMercadoPagoAPI(paymentRequest);

      // Log the result
      await logTransaction(
        'sale',
        paymentRequest.saleId,
        paymentRequest.amount,
        mockResponse.success ? 'success' : 'failed',
        mockResponse.externalId,
        mockResponse.error
      );

      if (mockResponse.success) {
        toast({
          title: "Pago procesado",
          description: `Pago de $${paymentRequest.amount} procesado correctamente en Mercado Pago`,
        });
      }

      return mockResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      await logTransaction(
        'sale',
        paymentRequest.saleId,
        paymentRequest.amount,
        'failed',
        undefined,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const simulateMercadoPagoAPI = async (request: PaymentRequest): Promise<PaymentResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure based on environment
    const isSuccess = configuration?.environment === 'sandbox' ? true : Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        externalId: `MP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: `TXN_${Date.now()}`
      };
    } else {
      return {
        success: false,
        error: 'Simulación de error en Mercado Pago'
      };
    }
  };

  const isPaymentMethodEnabled = (method: string): boolean => {
    if (!configuration) return false;

    switch (method) {
      case 'cash':
      case 'efectivo':
        return configuration.enabledPaymentMethods.cash;
      case 'card':
      case 'tarjeta':
        return configuration.enabledPaymentMethods.card;
      case 'transfer':
      case 'transferencia':
        return configuration.enabledPaymentMethods.transfer;
      default:
        return false;
    }
  };

  const syncSale = async (saleId: string) => {
    if (!isConfigured || !configuration?.autoSync) {
      return;
    }

    try {
      // This would sync a completed sale back to Mercado Pago
      // For audit and reconciliation purposes
      await logTransaction(
        'sync',
        saleId,
        0,
        'success'
      );
    } catch (error) {
      console.error('Error syncing sale:', error);
    }
  };

  return {
    isConfigured,
    configuration,
    loading,
    processPayment,
    isPaymentMethodEnabled,
    syncSale,
    logTransaction,
    reloadConfiguration: loadConfiguration
  };
};