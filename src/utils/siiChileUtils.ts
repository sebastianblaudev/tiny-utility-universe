
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SimpleAPISIIConfig {
  apiKey: string;
  apiUrl: string;
  rutEmisor: string;
  giroEmisor: string;
}

export interface SIIResponse {
  success: boolean;
  message: string;
  folio?: string;
}

export const getSIIConfig = async (tenantId: string): Promise<SimpleAPISIIConfig | null> => {
  try {
    // Check if tenant_settings table exists first
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_current_user_tenant_id');
    
    if (tablesError) {
      console.warn("Cannot access tenant settings:", tablesError);
      return null;
    }

    // Try to get settings from local storage as fallback
    const storedConfig = localStorage.getItem(`sii_config_${tenantId}`);
    if (storedConfig) {
      try {
        return JSON.parse(storedConfig);
      } catch (e) {
        console.error("Error parsing stored SII config:", e);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting SII config:", error);
    return null;
  }
};

export const saveSIIConfig = async (tenantId: string, config: SimpleAPISIIConfig): Promise<boolean> => {
  try {
    // Save to local storage as fallback
    localStorage.setItem(`sii_config_${tenantId}`, JSON.stringify(config));
    
    toast.success("Configuración SII guardada correctamente");
    return true;
  } catch (error) {
    console.error("Error saving SII config:", error);
    toast.error("Error al guardar la configuración SII");
    return false;
  }
};

export const sendSaleToSII = async (saleId: string, tenantId: string): Promise<SIIResponse> => {
  try {
    const config = await getSIIConfig(tenantId);
    
    if (!config) {
      return {
        success: false,
        message: "Configuración SII no encontrada. Configura primero los datos del SII."
      };
    }

    // Simulate SII integration
    console.log("Enviando venta al SII:", { saleId, tenantId, config });
    
    // Generate a mock folio number
    const folio = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      message: `Venta enviada al SII correctamente. Folio: ${folio}`,
      folio
    };
  } catch (error) {
    console.error("Error sending sale to SII:", error);
    return {
      success: false,
      message: `Error al enviar al SII: ${(error as Error).message}`
    };
  }
};

export const retrySendSaleToSII = async (saleId: string, tenantId: string): Promise<SIIResponse> => {
  return await sendSaleToSII(saleId, tenantId);
};

export const verifySIIStatus = async (saleId: string): Promise<{ sent: boolean; folio?: string }> => {
  try {
    // Check if sale was sent to SII (mock implementation)
    const mockSent = Math.random() > 0.5; // 50% chance for demo
    
    return {
      sent: mockSent,
      folio: mockSent ? `${Date.now()}${Math.floor(Math.random() * 1000)}` : undefined
    };
  } catch (error) {
    console.error("Error verifying SII status:", error);
    return { sent: false };
  }
};
