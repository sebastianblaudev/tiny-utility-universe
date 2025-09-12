export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mesas: {
        Row: {
          capacidad: number | null
          created_at: string
          estado: Database["public"]["Enums"]["mesa_estado"]
          id: string
          nombre: string | null
          numero: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacidad?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["mesa_estado"]
          id?: string
          nombre?: string | null
          numero: number
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          capacidad?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["mesa_estado"]
          id?: string
          nombre?: string | null
          numero?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedido_mesa_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          observaciones: string | null
          pedido_id: string
          precio: number
          producto_id: string | null
          producto_nombre: string
          subtotal: number
          tenant_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          observaciones?: string | null
          pedido_id: string
          precio?: number
          producto_id?: string | null
          producto_nombre: string
          subtotal?: number
          tenant_id?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          observaciones?: string | null
          pedido_id?: string
          precio?: number
          producto_id?: string | null
          producto_nombre?: string
          subtotal?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_mesa_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_mesa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_mesa_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_mesa: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["pedido_estado"]
          id: string
          mesa_id: string
          numero_pedido: number
          observaciones: string | null
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          mesa_id: string
          numero_pedido: number
          observaciones?: string | null
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          id?: string
          mesa_id?: string
          numero_pedido?: number
          observaciones?: string | null
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_mesa_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_configurations: {
        Row: {
          config_data: Json | null
          created_at: string
          id: string
          is_enabled: boolean
          plugin_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config_data?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          plugin_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          config_data?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          plugin_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plugin_configurations_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugin_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_definitions: {
        Row: {
          author: string | null
          config_schema: Json | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
          version?: string
        }
        Update: {
          author?: string | null
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      product_colors: {
        Row: {
          created_at: string
          hex_code: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          hex_code: string
          id?: string
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          hex_code?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          color: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_by_weight: boolean | null
          name: string
          price: number
          stock: number | null
          tenant_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          color?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean | null
          name: string
          price?: number
          stock?: number | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          color?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_by_weight?: boolean | null
          name?: string
          price?: number
          stock?: number | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          subtotal?: number
          tenant_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          tenant_id?: string
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
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_id: string
          tenant_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_id?: string
          tenant_id?: string
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
          caja_id: string | null
          cashier_name: string | null
          created_at: string
          customer_id: string | null
          date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_type: string | null
          status: Database["public"]["Enums"]["sale_status"]
          tenant_id: string
          total: number
          turno_id: string | null
          updated_at: string
        }
        Insert: {
          caja_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_id?: string | null
          date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tenant_id?: string
          total?: number
          turno_id?: string | null
          updated_at?: string
        }
        Update: {
          caja_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_id?: string | null
          date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_type?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          tenant_id?: string
          total?: number
          turno_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
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
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          monto: number
          tenant_id: string
          tipo: Database["public"]["Enums"]["transaccion_tipo"]
          turno_id: string
          venta_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          tenant_id?: string
          tipo: Database["public"]["Enums"]["transaccion_tipo"]
          turno_id: string
          venta_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          monto?: number
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["transaccion_tipo"]
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
          {
            foreignKeyName: "turno_transacciones_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          cajero_id: string | null
          cajero_nombre: string
          created_at: string
          estado: Database["public"]["Enums"]["turno_estado"]
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
          estado?: Database["public"]["Enums"]["turno_estado"]
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_final?: number | null
          monto_inicial?: number
          observaciones?: string | null
          tenant_id?: string
        }
        Update: {
          cajero_id?: string | null
          cajero_nombre?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["turno_estado"]
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
      get_current_user_tenant_id_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      mesa_estado: "libre" | "ocupada" | "reservada"
      payment_method: "efectivo" | "tarjeta" | "transferencia" | "mixto"
      pedido_estado:
        | "pendiente"
        | "preparando"
        | "listo"
        | "entregado"
        | "cancelado"
      sale_status: "draft" | "completed" | "cancelled"
      transaccion_tipo: "ingreso" | "egreso" | "venta"
      turno_estado: "abierto" | "cerrado"
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
      mesa_estado: ["libre", "ocupada", "reservada"],
      payment_method: ["efectivo", "tarjeta", "transferencia", "mixto"],
      pedido_estado: [
        "pendiente",
        "preparando",
        "listo",
        "entregado",
        "cancelado",
      ],
      sale_status: ["draft", "completed", "cancelled"],
      transaccion_tipo: ["ingreso", "egreso", "venta"],
      turno_estado: ["abierto", "cerrado"],
    },
  },
} as const
