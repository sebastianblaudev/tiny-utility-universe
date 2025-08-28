import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from '@/lib/supabase-helpers';

export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  environment: 'sandbox' | 'production';
}

export interface PaymentOrder {
  amount: number;
  description: string;
  paymentMethod: string;
  saleId: string;
  customerEmail?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  externalId?: string;
  error?: string;
  status?: string;
}

export class MercadoPagoService {
  private config: MercadoPagoConfig | null = null;
  private baseUrl: string = '';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      const { data } = await supabase
        .from('plugin_configurations')
        .select('configuration')
        .eq('tenant_id', tenantId)
        .eq('plugin_key', 'mercado_pago_pos')
        .eq('is_active', true)
        .single();

      if (data?.configuration) {
        this.config = data.configuration as unknown as MercadoPagoConfig;
        this.baseUrl = this.config.environment === 'sandbox' 
          ? 'https://api.mercadopago.com/sandbox'
          : 'https://api.mercadopago.com';
      }
    } catch (error) {
      console.error('Error initializing MercadoPago service:', error);
    }
  }

  async createPaymentOrder(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'Mercado Pago no está configurado'
      };
    }

    try {
      // In a real implementation, this would make actual API calls to Mercado Pago
      // For now, we'll simulate the API response
      const result = await this.simulatePaymentCreation(order);
      
      // Log the transaction
      await this.logTransaction('payment_creation', order, result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      await this.logTransaction('payment_creation', order, {
        success: false,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getPaymentStatus(externalId: string): Promise<PaymentResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'Mercado Pago no está configurado'
      };
    }

    try {
      // Simulate status check
      const result = await this.simulateStatusCheck(externalId);
      
      await this.logTransaction('status_check', { externalId }, result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async refundPayment(externalId: string, amount?: number): Promise<PaymentResult> {
    if (!this.config) {
      return {
        success: false,
        error: 'Mercado Pago no está configurado'
      };
    }

    try {
      // Simulate refund
      const result = await this.simulateRefund(externalId, amount);
      
      await this.logTransaction('refund', { externalId, amount }, result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async simulatePaymentCreation(order: PaymentOrder): Promise<PaymentResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate different outcomes based on amount (for testing)
    const shouldSucceed = order.amount < 100000 || this.config?.environment === 'sandbox';

    if (shouldSucceed) {
      return {
        success: true,
        externalId: `MP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: `TXN_${Date.now()}`,
        status: 'approved'
      };
    } else {
      return {
        success: false,
        error: 'Pago rechazado por el emisor',
        status: 'rejected'
      };
    }
  }

  private async simulateStatusCheck(externalId: string): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate payment status
    const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      success: randomStatus === 'approved',
      externalId,
      status: randomStatus,
      error: randomStatus === 'rejected' ? 'Pago rechazado' : undefined
    };
  }

  private async simulateRefund(externalId: string, amount?: number): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      externalId,
      transactionId: `REFUND_${Date.now()}`,
      status: 'refunded'
    };
  }

  private async logTransaction(
    type: string,
    request: any,
    response: PaymentResult
  ) {
    try {
      const tenantId = await getCurrentUserTenantId();
      if (!tenantId) return;

      await supabase
        .from('plugin_transaction_logs')
        .insert({
          tenant_id: tenantId,
          plugin_key: 'mercado_pago_pos',
          transaction_type: type,
          external_transaction_id: response.externalId,
          internal_sale_id: request.saleId,
          amount: request.amount,
          status: response.success ? 'success' : 'failed',
          request_data: request as any,
          response_data: response as any,
          error_message: response.error
        });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}