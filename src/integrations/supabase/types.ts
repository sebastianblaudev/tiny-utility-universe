export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          address: string
          blocked_names: Json | null
          branch_name: string
          created_at: string | null
          id: string
          language_settings: Json | null
          phone: string
          receipt_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string
          blocked_names?: Json | null
          branch_name?: string
          created_at?: string | null
          id?: string
          language_settings?: Json | null
          phone?: string
          receipt_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          blocked_names?: Json | null
          branch_name?: string
          created_at?: string | null
          id?: string
          language_settings?: Json | null
          phone?: string
          receipt_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      barber_commissions: {
        Row: {
          barber_id: string
          barber_name: string | null
          category_id: string | null
          created_at: string | null
          id: string
          percentage: number
          service_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barber_id: string
          barber_name?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          percentage: number
          service_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barber_id?: string
          barber_name?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          percentage?: number
          service_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      barbers: {
        Row: {
          barber_id: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cash_advances: {
        Row: {
          advance_id: string
          amount: number
          barber_id: string
          barber_name: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          payment_method: string
          settled: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advance_id: string
          amount?: number
          barber_id: string
          barber_name?: string | null
          created_at?: string | null
          date: string
          description?: string
          id?: string
          payment_method?: string
          settled?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advance_id?: string
          amount?: number
          barber_id?: string
          barber_name?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          payment_method?: string
          settled?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          birthday: string | null
          created_at: string
          customer_id: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          created_at?: string
          customer_id?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          birthday?: string | null
          created_at?: string
          customer_id?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_transaction_date: string | null
          points: number
          total_points_earned: number
          total_points_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_transaction_date?: string | null
          points?: number
          total_points_earned?: number
          total_points_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_transaction_date?: string | null
          points?: number
          total_points_earned?: number
          total_points_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_expenses: {
        Row: {
          amount: number
          branch_id: string
          category: string
          created_at: string
          date: string
          description: string
          id: string
          last_paid: string | null
          next_due: string | null
          periodicity: string | null
          recurrent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          branch_id?: string
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          last_paid?: string | null
          next_due?: string | null
          periodicity?: string | null
          recurrent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          branch_id?: string
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          last_paid?: string | null
          next_due?: string | null
          periodicity?: string | null
          recurrent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          points: number
          sale_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          points: number
          sale_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          points?: number
          sale_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          price: number
          product_id: string
          stock: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          price?: number
          product_id: string
          stock?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          product_id?: string
          stock?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          pin: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          pin?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          pin?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          applicable_categories: Json | null
          applicable_items: Json | null
          buy_x_get_y_details: Json | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          minimum_purchase: number | null
          name: string
          promotion_id: string
          requires_owner_pin: boolean | null
          start_date: string
          type: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          active?: boolean | null
          applicable_categories?: Json | null
          applicable_items?: Json | null
          buy_x_get_y_details?: Json | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          minimum_purchase?: number | null
          name: string
          promotion_id: string
          requires_owner_pin?: boolean | null
          start_date: string
          type: string
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          active?: boolean | null
          applicable_categories?: Json | null
          applicable_items?: Json | null
          buy_x_get_y_details?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          minimum_purchase?: number | null
          name?: string
          promotion_id?: string
          requires_owner_pin?: boolean | null
          start_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          applied_promotion: Json | null
          barber_id: string
          created_at: string | null
          date: string
          discount: Json | null
          id: string
          items: Json
          payment_method: string
          sale_id: string
          split_payments: Json | null
          tip: Json | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_promotion?: Json | null
          barber_id: string
          created_at?: string | null
          date: string
          discount?: Json | null
          id?: string
          items?: Json
          payment_method?: string
          sale_id: string
          split_payments?: Json | null
          tip?: Json | null
          total?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_promotion?: Json | null
          barber_id?: string
          created_at?: string | null
          date?: string
          discount?: Json | null
          id?: string
          items?: Json
          payment_method?: string
          sale_id?: string
          split_payments?: Json | null
          tip?: Json | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          barber_barcodes: Json | null
          barber_id: string | null
          barcode: string | null
          category_id: string
          created_at: string | null
          duration: number
          id: string
          name: string
          price: number
          service_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barber_barcodes?: Json | null
          barber_id?: string | null
          barcode?: string | null
          category_id: string
          created_at?: string | null
          duration?: number
          id?: string
          name: string
          price?: number
          service_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barber_barcodes?: Json | null
          barber_id?: string | null
          barcode?: string | null
          category_id?: string
          created_at?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          service_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_users: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          is_blocked: boolean | null
          name: string
          pin: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          name: string
          pin: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          is_blocked?: boolean | null
          name?: string
          pin?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          barber_id: string
          barber_name: string | null
          created_at: string | null
          date: string
          id: string
          payment_method: string
          sale_id: string | null
          tip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          barber_id: string
          barber_name?: string | null
          created_at?: string | null
          date: string
          id?: string
          payment_method?: string
          sale_id?: string | null
          tip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          barber_id?: string
          barber_name?: string | null
          created_at?: string | null
          date?: string
          id?: string
          payment_method?: string
          sale_id?: string | null
          tip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          notifications_enabled: boolean | null
          preferences: Json | null
          sidebar_open: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notifications_enabled?: boolean | null
          preferences?: Json | null
          sidebar_open?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notifications_enabled?: boolean | null
          preferences?: Json | null
          sidebar_open?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_barcode: {
        Args: { prefix?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
