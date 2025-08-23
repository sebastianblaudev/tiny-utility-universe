
/* Define los tipos para las funciones RPC de Supabase */
export interface RPCDefinitions {
  "get_current_user_tenant_id": {
    Args: Record<string, never>;
    Returns: string;
  };
  "get_tenant_id_from_auth": {
    Args: Record<string, never>;
    Returns: string;
  };
  "get_product_categories": {
    Args: {
      tenant_id_param: string;
    };
    Returns: {
      id: string;
      name: string;
      product_count: number;
    }[];
  };
  "add_product_category": {
    Args: {
      category_name: string;
      tenant_id_param: string;
    };
    Returns: {
      id: string;
      name: string;
    };
  };
  "get_sales_by_payment_method": {
    Args: {
      tenant_id_param: string;
      start_date?: string;
      end_date?: string;
    };
    Returns: {
      payment_method: string;
      total: number;
      count: number;
    }[];
  };
  "get_sales_by_cashier": {
    Args: {
      tenant_id_param: string;
      start_date?: string;
      end_date?: string;
    };
    Returns: {
      cashier_id: string;
      cashier_name: string;
      total: number;
      count: number;
    }[];
  };
  "get_cashier_sales_summary": {
    Args: {
      tenant_id_param: string;
      cashier_id: string;
      start_date?: string;
      end_date?: string;
    };
    Returns: {
      total_sales: number;
      total_orders: number;
      payment_methods: {
        payment_method: string;
        total: number;
        count: number;
      }[];
    };
  };
  "get_turno_sales_by_payment_method": {
    Args: {
      turno_id_param: string;
    };
    Returns: {
      payment_method: string;
      total: number;
      count: number;
    }[];
  };
  // Add the missing RPC functions
  "get_sales_by_cashier_and_payment_method": {
    Args: {
      tenant_id_param: string;
      start_date?: string;
      end_date?: string;
    };
    Returns: {
      cashier_id: string;
      cashier_name: string;
      payment_method: string;
      count: number;
      total: number;
    }[];
  };
  "get_turno_sales_stats": {
    Args: {
      turno_id_param: string;
    };
    Returns: {
      payment_method: string;
      count: number;
      total: number;
    }[];
  };
  "get_turno_sales_by_cashier": {
    Args: {
      turno_id_param: string;
    };
    Returns: {
      cashier_id: string;
      cashier_name: string;
      count: number;
      total: number;
    }[];
  };
  "verify_admin_password": {
    Args: {
      input_password: string;
    };
    Returns: {
      success: boolean;
      error?: string;
      message?: string;
    };
  };
  "delete_product_with_admin_check": {
    Args: {
      product_id: string;
      admin_password: string;
    };
    Returns: {
      success: boolean;
      error?: string;
      message?: string;
    };
  };
}
