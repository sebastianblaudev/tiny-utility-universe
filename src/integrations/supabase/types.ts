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
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          location_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          location_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          location_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          location_id: string
          name: string
          phone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          location_id: string
          name: string
          phone: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          last_order_id: string | null
          location_id: string
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          last_order_id?: string | null
          location_id: string
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          last_order_id?: string | null
          location_id?: string
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_customers_last_order_id_fkey"
            columns: ["last_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_customers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string
          id: string
          location_id: string
          name: string
          price_per_kg: number | null
          stock_quantity: number | null
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          name: string
          price_per_kg?: number | null
          stock_quantity?: number | null
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          price_per_kg?: number | null
          stock_quantity?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string
          email: string
          hero_image_url: string | null
          id: string
          is_open_for_orders: boolean | null
          name: string
          owner_id: string | null
          phone: string | null
          subscription_status: string | null
          trial_ends_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string
          email: string
          hero_image_url?: string | null
          id?: string
          is_open_for_orders?: boolean | null
          name: string
          owner_id?: string | null
          phone?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string
          email?: string
          hero_image_url?: string | null
          id?: string
          is_open_for_orders?: boolean | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      online_orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          id: string
          location_id: string
          order_data: Json
          order_status: string
          payment_status: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          location_id: string
          order_data: Json
          order_status?: string
          payment_status?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          location_id?: string
          order_data?: Json
          order_status?: string
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      optional_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          large_price: number | null
          location_id: string
          medium_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          large_price?: number | null
          location_id: string
          medium_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          large_price?: number | null
          location_id?: string
          medium_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "optional_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optional_ingredients_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          daily_number: number | null
          delivery_status: string | null
          id: string
          is_open: boolean | null
          items: Json
          latitude: number | null
          location_id: string
          longitude: number | null
          on_hold: boolean | null
          order_type: string
          payment_method: string
          phone_number: string | null
          sent_to_kitchen: Json | null
          session_id: string | null
          status: string
          subtotal: number
          table_number: string | null
          tax: number
          total: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          daily_number?: number | null
          delivery_status?: string | null
          id?: string
          is_open?: boolean | null
          items: Json
          latitude?: number | null
          location_id: string
          longitude?: number | null
          on_hold?: boolean | null
          order_type: string
          payment_method: string
          phone_number?: string | null
          sent_to_kitchen?: Json | null
          session_id?: string | null
          status?: string
          subtotal: number
          table_number?: string | null
          tax: number
          total: number
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          daily_number?: number | null
          delivery_status?: string | null
          id?: string
          is_open?: boolean | null
          items?: Json
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          on_hold?: boolean | null
          order_type?: string
          payment_method?: string
          phone_number?: string | null
          sent_to_kitchen?: Json | null
          session_id?: string | null
          status?: string
          subtotal?: number
          table_number?: string | null
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          ingredient_id: string
          product_id: string
          quantity: number | null
        }
        Insert: {
          ingredient_id: string
          product_id: string
          quantity?: number | null
        }
        Update: {
          ingredient_id?: string
          product_id?: string
          quantity?: number | null
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
          barcode: string | null
          base_price: number
          category_id: string | null
          color: string | null
          cost_calculation_type: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          large_price: number | null
          location_id: string
          medium_price: number | null
          mega_price: number | null
          name: string
          size_names: Json | null
          xl_price: number | null
          xxl_price: number | null
          xxxl_price: number | null
        }
        Insert: {
          barcode?: string | null
          base_price: number
          category_id?: string | null
          color?: string | null
          cost_calculation_type?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          large_price?: number | null
          location_id: string
          medium_price?: number | null
          mega_price?: number | null
          name: string
          size_names?: Json | null
          xl_price?: number | null
          xxl_price?: number | null
          xxxl_price?: number | null
        }
        Update: {
          barcode?: string | null
          base_price?: number
          category_id?: string | null
          color?: string | null
          cost_calculation_type?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          large_price?: number | null
          location_id?: string
          medium_price?: number | null
          mega_price?: number | null
          name?: string
          size_names?: Json | null
          xl_price?: number | null
          xxl_price?: number | null
          xxxl_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          location_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          location_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          location_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          promotion_id: string
          quantity: number | null
          size: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          promotion_id: string
          quantity?: number | null
          size?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          promotion_id?: string
          quantity?: number | null
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          location_id: string
          max_free_ingredients: number | null
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          location_id: string
          max_free_ingredients?: number | null
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string
          max_free_ingredients?: number | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          id: string
          location_id: string
          order_id: string
          receipt_data: Json | null
          receipt_number: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          order_id: string
          receipt_data?: Json | null
          receipt_number?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          order_id?: string
          receipt_data?: Json | null
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          business_name: string | null
          created_at: string
          hero_image: string | null
          id: string
          location_id: string
          logo_url: string | null
          receipt_header: string | null
          tax_enabled: boolean | null
          tax_rate: number | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          hero_image?: string | null
          id?: string
          location_id: string
          logo_url?: string | null
          receipt_header?: string | null
          tax_enabled?: boolean | null
          tax_rate?: number | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          hero_image?: string | null
          id?: string
          location_id?: string
          logo_url?: string | null
          receipt_header?: string | null
          tax_enabled?: boolean | null
          tax_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          card_sales: number | null
          cash_sales: number | null
          created_at: string | null
          end_time: string | null
          id: string
          initial_cash: number | null
          location_id: string
          notes: string | null
          start_time: string | null
          status: string
          transfer_sales: number | null
          user_id: string
        }
        Insert: {
          card_sales?: number | null
          cash_sales?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          initial_cash?: number | null
          location_id: string
          notes?: string | null
          start_time?: string | null
          status?: string
          transfer_sales?: number | null
          user_id: string
        }
        Update: {
          card_sales?: number | null
          cash_sales?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          initial_cash?: number | null
          location_id?: string
          notes?: string | null
          start_time?: string | null
          status?: string
          transfer_sales?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_daily_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_location: {
        Args: { user_id: string }
        Returns: {
          location_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_in_location: {
        Args: { user_id: string; loc_id: string }
        Returns: boolean
      }
      reset_daily_order_number: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "cashier" | "kitchen" | "delivery" | "super_admin"
      order_status: "pending_approval" | "approved" | "rejected" | "completed"
      user_role:
        | "admin"
        | "cashier"
        | "waiter"
        | "kitchen"
        | "delivery"
        | "super_admin"
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
      app_role: ["admin", "cashier", "kitchen", "delivery", "super_admin"],
      order_status: ["pending_approval", "approved", "rejected", "completed"],
      user_role: [
        "admin",
        "cashier",
        "waiter",
        "kitchen",
        "delivery",
        "super_admin",
      ],
    },
  },
} as const
