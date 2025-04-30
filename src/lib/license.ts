
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
  isLocalLicense?: boolean;
}

export const checkBusinessLicense = async (email: string): Promise<LicenseStatus> => {
  try {
    // First check if there's a local license
    const localLicense = localStorage.getItem('localLicense');
    if (localLicense) {
      const licenseData = JSON.parse(localLicense);
      
      if (licenseData.email === email && licenseData.isValid) {
        console.log("Found valid local license:", licenseData);
        return {
          found: true,
          businessId: licenseData.businessId || 'local',
          name: licenseData.businessName || '',
          email: licenseData.email,
          isActive: true,
          isValid: true,
          membershipActive: true,
          isLocalLicense: true,
          message: 'Licencia local activa'
        };
      }
    }

    // Then try to check with Supabase if available
    try {
      // First check if the business exists and is active
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

      // Check license status
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
      console.log("Error checking online license, falling back to local check:", error);
      
      // If Supabase check fails due to connection issues, check for local license again
      const localLicense = localStorage.getItem('localLicense');
      if (localLicense) {
        try {
          const licenseData = JSON.parse(localLicense);
          
          if (licenseData.email === email && licenseData.isValid) {
            console.log("Using local license as fallback");
            return {
              found: true,
              businessId: licenseData.businessId || 'local',
              name: licenseData.businessName || '',
              email: licenseData.email,
              isActive: true,
              isValid: true,
              membershipActive: true,
              isLocalLicense: true,
              message: 'Licencia local activa (modo sin conexión)'
            };
          }
        } catch (e) {
          console.error("Error parsing local license:", e);
        }
      }
      
      console.error('Error checking license:', error);
      return {
        found: false,
        message: 'Error al verificar la licencia. Verfique su conexión a Internet.'
      };
    }
  } catch (error) {
    console.error('Error in license check process:', error);
    return {
      found: false,
      message: 'Error al verificar la licencia'
    };
  }
};

export const activateLicense = async (businessId: string, licenseKey: string): Promise<{success: boolean, message: string}> => {
  // Trim the license key to avoid whitespace issues
  const trimmedLicenseKey = licenseKey.trim();
  
  try {
    // First check if there's a local license that matches
    const localLicenseStore = localStorage.getItem('generatedLicenses');
    if (localLicenseStore) {
      try {
        const licenses = JSON.parse(localLicenseStore);
        const matchingLicense = licenses.find((l: any) => 
          l.licenseKey === trimmedLicenseKey || l.licenseKey === licenseKey
        );
        
        if (matchingLicense) {
          console.log("Found matching local license:", matchingLicense);
          
          // Save as the active local license
          const localLicense = {
            businessId: matchingLicense.businessId || 'local',
            businessName: matchingLicense.businessName || 'Negocio Local',
            email: matchingLicense.email,
            licenseKey: matchingLicense.licenseKey,
            isValid: true,
            activatedAt: new Date().toISOString()
          };
          
          localStorage.setItem('localLicense', JSON.stringify(localLicense));
          
          // Also store business info for the app
          localStorage.setItem('businessName', matchingLicense.businessName || 'Negocio Local');
          localStorage.setItem('businessEmail', matchingLicense.email);
          
          return {
            success: true,
            message: 'Licencia local activada correctamente'
          };
        }
      } catch (e) {
        console.error("Error checking local licenses:", e);
      }
    }
    
    // If no local license match, try Supabase
    try {
      const { data, error } = await supabase.functions.invoke<{success: boolean, message: string}>('activate_business_license', {
        body: { 
          p_business_id: businessId,
          p_license_key: trimmedLicenseKey
        }
      });

      if (error) throw error;

      if (data && data.success) {
        // Get business info to store locally
        const { data: businessData } = await supabase
          .from('businesses')
          .select('name, email')
          .eq('id', businessId)
          .single();
        
        if (businessData) {
          localStorage.setItem('businessName', businessData.name || '');
          localStorage.setItem('businessEmail', businessData.email || '');
        }
      }

      return {
        success: data?.success || false,
        message: data?.message || 'Respuesta del servidor no válida'
      };
    } catch (error) {
      console.error('Error activating online license:', error);
      return {
        success: false,
        message: 'Error al activar la licencia. Verifique su conexión a Internet.'
      };
    }
  } catch (error) {
    console.error('Error in license activation process:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al activar la licencia'
    };
  }
};

export const deactivateLicense = async (businessId: string): Promise<{success: boolean, message: string}> => {
  try {
    // Check if it's a local license
    const localLicense = localStorage.getItem('localLicense');
    if (localLicense && (businessId === 'local' || JSON.parse(localLicense).businessId === businessId)) {
      localStorage.removeItem('localLicense');
      return {
        success: true,
        message: 'Licencia local desactivada correctamente'
      };
    }
    
    // Try to deactivate with Supabase
    try {
      const { data, error } = await supabase.functions.invoke<{success: boolean, message: string}>('deactivate_business_license', {
        body: { 
          p_business_id: businessId
        }
      });

      if (error) throw error;

      return {
        success: data?.success || false,
        message: data?.message || 'Error al desactivar la licencia'
      };
    } catch (error) {
      console.error('Error deactivating online license:', error);
      return {
        success: false,
        message: 'Error al desactivar la licencia. Verifique su conexión a Internet.'
      };
    }
  } catch (error) {
    console.error('Error in license deactivation process:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al desactivar la licencia'
    };
  }
};

export const createLocalLicense = (businessName: string, email: string): {licenseKey: string, success: boolean, message: string} => {
  try {
    // Generate a random license key (simple format for demo)
    const generateRandomString = (length: number) => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    // Format: XXXX-XXXX-XXXX-XXXX
    const licenseKey = `${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}`;
    
    // Store in local storage
    const newLicense = {
      businessId: 'local-' + Date.now(),
      businessName,
      email,
      licenseKey,
      createdAt: new Date().toISOString()
    };
    
    // Add to generated licenses array
    let licenses = [];
    const existingLicenses = localStorage.getItem('generatedLicenses');
    if (existingLicenses) {
      try {
        licenses = JSON.parse(existingLicenses);
        if (!Array.isArray(licenses)) licenses = [];
      } catch (e) {
        console.error("Error parsing existing licenses:", e);
        licenses = [];
      }
    }
    
    licenses.push(newLicense);
    localStorage.setItem('generatedLicenses', JSON.stringify(licenses));
    
    return {
      licenseKey,
      success: true,
      message: 'Licencia local generada correctamente'
    };
  } catch (error) {
    console.error('Error generating local license:', error);
    return {
      licenseKey: '',
      success: false,
      message: error instanceof Error ? error.message : 'Error al generar la licencia local'
    };
  }
};
