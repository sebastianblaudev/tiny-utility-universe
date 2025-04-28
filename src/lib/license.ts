
import { supabase } from "@/integrations/supabase/client";

export interface LicenseStatus {
  found: boolean;
  businessId?: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  trialStarted?: string;
  trialDays?: number;
  trialEndsAt?: string;
  daysLeft?: number;
  membershipActive?: boolean;
  isValid?: boolean;
  message?: string;
}

export const checkBusinessLicense = async (email: string): Promise<LicenseStatus> => {
  try {
    // Primero verificamos si el negocio existe y está activo
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', email)
      .single();

    if (businessError) throw businessError;

    if (!businessData) {
      return {
        found: false,
        message: 'Negocio no encontrado'
      };
    }

    // Verificamos el estado de la licencia
    const { data, error } = await supabase.functions.invoke<LicenseStatus>('get_business_license_status', {
      body: { business_email: email }
    });
    
    if (error) throw error;

    if (!data) {
      return {
        found: true,
        isValid: false,
        message: 'No se pudo verificar el estado de la licencia'
      };
    }

    return {
      ...(data || {}),
      businessId: businessData.id,
      found: true
    };
  } catch (error) {
    console.error('Error checking license:', error);
    return {
      found: false,
      message: 'Error al verificar la licencia'
    };
  }
};

export const activateLicense = async (businessId: string, licenseKey: string): Promise<{success: boolean, message: string}> => {
  try {
    const { data, error } = await supabase.functions.invoke<{success: boolean, message: string}>('activate_business_license', {
      body: { 
        p_business_id: businessId,
        p_license_key: licenseKey
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Licencia activada correctamente'
    };
  } catch (error) {
    console.error('Error activating license:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al activar la licencia'
    };
  }
};

export const deactivateLicense = async (businessId: string): Promise<{success: boolean, message: string}> => {
  try {
    const { data, error } = await supabase.functions.invoke<{success: boolean, message: string}>('deactivate_business_license', {
      body: { 
        p_business_id: businessId
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Licencia desactivada correctamente'
    };
  } catch (error) {
    console.error('Error deactivating license:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al desactivar la licencia'
    };
  }
};
