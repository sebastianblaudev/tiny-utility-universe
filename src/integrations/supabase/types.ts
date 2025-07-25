export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cajas: {
        Row: {
          created_at: string | null
          estado: string
          fecha_apertura: string | null
          fecha_cierre: string | null
          hora_apertura: string | null
          hora_cierre: string | null
          id: string
          monto_final: number | null
          monto_inicial: number
          nombre_cajero: string | null
          observaciones: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          monto_final?: number | null
          monto_inicial?: number
          nombre_cajero?: string | null
          observaciones?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          monto_final?: number | null
          monto_inicial?: number
          nombre_cajero?: string | null
          observaciones?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      cashier_pins: {
        Row: {
          created_at: string
          id: string
          name: string
          pin: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pin: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pin?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cashiers: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          pin: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          pin?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          pin?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ingredient_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          ingredient_id: string
          notes: string | null
          sale_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          ingredient_id: string
          notes?: string | null
          sale_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          ingredient_id?: string
          notes?: string | null
          sale_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_transactions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          reorder_level: number | null
          stock: number
          unit: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          reorder_level?: number | null
          stock?: number
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          reorder_level?: number | null
          stock?: number
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      preparations: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          preparation_time: number | null
          quantity: number
          sale_id: string | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          preparation_time?: number | null
          quantity?: number
          sale_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          preparation_time?: number | null
          quantity?: number
          sale_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          color_code: string
          color_name: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          color_code: string
          color_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          color_code?: string
          color_name?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          ingredient_id: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          ingredient_id: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          ingredient_id?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          code: string
          color: string | null
          cost_price: number
          created_at: string | null
          id: string
          image_url: string | null
          is_by_weight: boolean | null
          is_weight_based: boolean | null
          name: string
          price: number
          stock: number
          tenant_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code: string
          color?: string | null
          cost_price: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean | null
          is_weight_based?: boolean | null
          name: string
          price: number
          stock?: number
          tenant_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          color?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean | null
          is_weight_based?: boolean | null
          name?: string
          price?: number
          stock?: number
          tenant_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sale_item_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          product_id: string
          sale_id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          product_id: string
          sale_id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          product_id?: string
          sale_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sale_item_notes_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sale_item_notes_sale_id"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          is_by_weight: boolean | null
          price: number
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          tenant_id: string | null
          unit: string | null
          weight: number | null
        }
        Insert: {
          id?: string
          is_by_weight?: boolean | null
          price: number
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
        }
        Update: {
          id?: string
          is_by_weight?: boolean | null
          price?: number
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payment_methods: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          sale_id: string
          tenant_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          sale_id: string
          tenant_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          sale_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payment_methods_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_name: string | null
          customer_id: string | null
          date: string | null
          id: string
          payment_method: string | null
          sale_type: string | null
          status: string
          tenant_id: string | null
          total: number
          turno_id: string | null
        }
        Insert: {
          cashier_name?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string
          payment_method?: string | null
          sale_type?: string | null
          status?: string
          tenant_id?: string | null
          total: number
          turno_id?: string | null
        }
        Update: {
          cashier_name?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string
          payment_method?: string | null
          sale_type?: string | null
          status?: string
          tenant_id?: string | null
          total?: number
          turno_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      transacciones_caja: {
        Row: {
          caja_id: string
          created_at: string | null
          descripcion: string | null
          fecha: string | null
          hora: string | null
          id: string
          metodo_pago: string
          monto: number
          tenant_id: string | null
          tipo: string
        }
        Insert: {
          caja_id: string
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          hora?: string | null
          id?: string
          metodo_pago: string
          monto: number
          tenant_id?: string | null
          tipo: string
        }
        Update: {
          caja_id?: string
          created_at?: string | null
          descripcion?: string | null
          fecha?: string | null
          hora?: string | null
          id?: string
          metodo_pago?: string
          monto?: number
          tenant_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_transacciones: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          metodo_pago: string
          monto: number
          tenant_id: string
          tipo: string
          turno_id: string
          venta_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          metodo_pago?: string
          monto: number
          tenant_id: string
          tipo: string
          turno_id: string
          venta_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          metodo_pago?: string
          monto?: number
          tenant_id?: string
          tipo?: string
          turno_id?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_transacciones_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          cajero_id: string | null
          cajero_nombre: string
          created_at: string
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          monto_final: number | null
          monto_inicial: number
          observaciones: string | null
          tenant_id: string
        }
        Insert: {
          cajero_id?: string | null
          cajero_nombre: string
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_final?: number | null
          monto_inicial?: number
          observaciones?: string | null
          tenant_id: string
        }
        Update: {
          cajero_id?: string | null
          cajero_nombre?: string
          created_at?: string
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_final?: number | null
          monto_inicial?: number
          observaciones?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_product_category: {
        Args: { category_name: string; tenant_id_param: string }
        Returns: boolean
      }
      count_tenant_sales: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      get_auth_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_cashier_sales_summary: {
        Args: {
          cashier_name_param: string
          tenant_id_param: string
          start_date_param?: string
          end_date_param?: string
        }
        Returns: {
          payment_method: string
          total_amount: number
          sale_count: number
        }[]
      }
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_tenant_id_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_isolated_receipt_data: {
        Args: { sale_id_param: string; tenant_id_param: string }
        Returns: {
          sale_id: string
          date: string
          total: number
          payment_method: string
          sale_type: string
          customer_name: string
          cashier_name: string
          item_id: string
          product_id: string
          product_name: string
          price: number
          quantity: number
          notes: string
        }[]
      }
      get_product_categories: {
        Args: { tenant_id_param: string }
        Returns: string[]
      }
      get_sales_by_cashier: {
        Args: {
          cashier_name_param: string
          tenant_id_param: string
          start_date_param?: string
          end_date_param?: string
        }
        Returns: {
          id: string
          total: number
          date: string
          payment_method: string
          sale_type: string
          status: string
        }[]
      }
      get_sales_by_payment_method: {
        Args: {
          tenant_id_param: string
          start_date?: string
          end_date?: string
        }
        Returns: {
          payment_method: string
          total: number
          count: number
        }[]
      }
      get_sales_with_details: {
        Args: {
          tenant_id_param: string
          limit_param?: number
          offset_param?: number
        }
        Returns: {
          id: string
          date: string
          total: number
          payment_method: string
          sale_type: string
          status: string
          tenant_id: string
          cashier_name: string
          customer_name: string
          customer_id: string
          mixed_payment_details: Json
        }[]
      }
      get_tenant_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_tenant_isolated_sales: {
        Args: { tenant_id_param: string }
        Returns: {
          id: string
          date: string
          total: number
          payment_method: string
          sale_type: string
          status: string
          tenant_id: string
          cashier_name: string
          customer_name: string
          customer_id: string
        }[]
      }
      get_turno_sales_by_payment_method: {
        Args: { turno_id_param: string }
        Returns: {
          payment_method: string
          total: number
          count: number
        }[]
      }
      get_turno_sales_by_payment_method_detailed: {
        Args: { turno_id_param: string }
        Returns: {
          payment_method: string
          total: number
          count: number
        }[]
      }
      log_tenant_security_event: {
        Args: {
          event_type: string
          table_name: string
          tenant_id_current: string
          tenant_id_attempted: string
          additional_info?: Json
        }
        Returns: undefined
      }
      validate_tenant_data_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          issue_type: string
          record_count: number
          details: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
