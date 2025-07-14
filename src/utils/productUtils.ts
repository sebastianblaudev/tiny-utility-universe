
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserTenantId } from "@/integrations/supabase/client";

export const getAllProducts = async () => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available for products query");
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", tenantId)
      .order("name");
    
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    
    console.log("Productos cargados:", data);
    return data || [];
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available for product query");
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", tenantId)
      .single();
    
    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getProductById:", error);
    return null;
  }
};

export const searchProductsByName = async (searchTerm: string) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available for product search");
      return [];
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", tenantId)
      .ilike("name", `%${searchTerm}%`)
      .order("name");
    
    if (error) {
      console.error("Error searching products:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in searchProductsByName:", error);
    return [];
  }
};

export const searchProductsByBarcode = async (barcode: string) => {
  try {
    const tenantId = await getCurrentUserTenantId();
    if (!tenantId) {
      console.error("No tenant ID available for barcode search");
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("code", barcode)
      .eq("user_id", tenantId)
      .maybeSingle();
    
    if (error) {
      console.error("Error searching product by barcode:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in searchProductsByBarcode:", error);
    return null;
  }
};

// Color utility functions for ProductImage component
export const isLightColor = (color: string): boolean => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const getProductDisplayColor = (product: { id: string; name: string }): string => {
  // Generate a consistent color based on product ID and name
  const str = product.id + product.name;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to HSL color
  const hue = Math.abs(hash) % 360;
  const saturation = 45 + (Math.abs(hash) % 30); // 45-75%
  const lightness = 65 + (Math.abs(hash) % 20); // 65-85%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
