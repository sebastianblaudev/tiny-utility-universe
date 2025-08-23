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
      cross_tenant_sales_backup: {
        Row: {
          id: string | null
          is_by_weight: boolean | null
          price: number | null
          product_id: string | null
          product_tenant_id: string | null
          quantity: number | null
          sale_id: string | null
          sale_tenant_id: string | null
          subtotal: number | null
          tenant_id: string | null
          unit: string | null
          weight: number | null
        }
        Insert: {
          id?: string | null
          is_by_weight?: boolean | null
          price?: number | null
          product_id?: string | null
          product_tenant_id?: string | null
          quantity?: number | null
          sale_id?: string | null
          sale_tenant_id?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
        }
        Update: {
          id?: string | null
          is_by_weight?: boolean | null
          price?: number | null
          product_id?: string | null
          product_tenant_id?: string | null
          quantity?: number | null
          sale_id?: string | null
          sale_tenant_id?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
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
      mesas: {
        Row: {
          capacidad: number | null
          created_at: string
          estado: string
          id: string
          nombre: string | null
          numero: number
          tenant_id: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          capacidad?: number | null
          created_at?: string
          estado?: string
          id?: string
          nombre?: string | null
          numero: number
          tenant_id: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          capacidad?: number | null
          created_at?: string
          estado?: string
          id?: string
          nombre?: string | null
          numero?: number
          tenant_id?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_locks: {
        Row: {
          created_at: string
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          page_name: string
          page_route: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          page_name: string
          page_route: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          page_name?: string
          page_route?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          admin_user_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          status: string
          target_email: string
          tenant_id: string
        }
        Insert: {
          admin_user_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          target_email: string
          tenant_id: string
        }
        Update: {
          admin_user_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          target_email?: string
          tenant_id?: string
        }
        Relationships: []
      }
      pedido_mesa_items: {
        Row: {
          cantidad: number
          created_at: string
          enviado_cocina_at: string | null
          estado: string
          id: string
          notas: string | null
          pedido_mesa_id: string
          precio_unitario: number
          product_id: string
          subtotal: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          enviado_cocina_at?: string | null
          estado?: string
          id?: string
          notas?: string | null
          pedido_mesa_id: string
          precio_unitario: number
          product_id: string
          subtotal: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          enviado_cocina_at?: string | null
          estado?: string
          id?: string
          notas?: string | null
          pedido_mesa_id?: string
          precio_unitario?: number
          product_id?: string
          subtotal?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_mesa_items_pedido_mesa_id_fkey"
            columns: ["pedido_mesa_id"]
            isOneToOne: false
            referencedRelation: "pedidos_mesa"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_mesa: {
        Row: {
          created_at: string
          estado: string
          id: string
          mesa_id: string
          mesero_nombre: string | null
          notas: string | null
          numero_pedido: number
          subtotal: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          mesa_id: string
          mesero_nombre?: string | null
          notas?: string | null
          numero_pedido: number
          subtotal?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          mesa_id?: string
          mesero_nombre?: string | null
          notas?: string | null
          numero_pedido?: number
          subtotal?: number
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
      products_backup: {
        Row: {
          category: string | null
          code: string | null
          color: string | null
          cost_price: number | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_by_weight: boolean | null
          is_weight_based: boolean | null
          name: string | null
          price: number | null
          stock: number | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          color?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_by_weight?: boolean | null
          is_weight_based?: boolean | null
          name?: string | null
          price?: number | null
          stock?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          color?: string | null
          cost_price?: number | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_by_weight?: boolean | null
          is_weight_based?: boolean | null
          name?: string | null
          price?: number | null
          stock?: number | null
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
      sale_items_backup: {
        Row: {
          id: string | null
          is_by_weight: boolean | null
          price: number | null
          product_id: string | null
          quantity: number | null
          sale_id: string | null
          subtotal: number | null
          tenant_id: string | null
          unit: string | null
          weight: number | null
        }
        Insert: {
          id?: string | null
          is_by_weight?: boolean | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          sale_id?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
        }
        Update: {
          id?: string | null
          is_by_weight?: boolean | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          sale_id?: string | null
          subtotal?: number | null
          tenant_id?: string | null
          unit?: string | null
          weight?: number | null
        }
        Relationships: []
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
      sales_backup: {
        Row: {
          cashier_name: string | null
          customer_id: string | null
          date: string | null
          id: string | null
          payment_method: string | null
          sale_type: string | null
          status: string | null
          tenant_id: string | null
          total: number | null
          turno_id: string | null
        }
        Insert: {
          cashier_name?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string | null
          payment_method?: string | null
          sale_type?: string | null
          status?: string | null
          tenant_id?: string | null
          total?: number | null
          turno_id?: string | null
        }
        Update: {
          cashier_name?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string | null
          payment_method?: string | null
          sale_type?: string | null
          status?: string | null
          tenant_id?: string | null
          total?: number | null
          turno_id?: string | null
        }
        Relationships: []
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
      tenant_data_audit: {
        Row: {
          record_count: number | null
          table_name: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      tenant_security_monitor: {
        Row: {
          newest_record: string | null
          oldest_record: string | null
          record_count: number | null
          table_name: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      tenant_security_status: {
        Row: {
          check_type: string | null
          status: string | null
          violation_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_product_category: {
        Args: { category_name: string; tenant_id_param: string }
        Returns: boolean
      }
      admin_reset_user_password: {
        Args: { new_password: string; target_user_email: string }
        Returns: Json
      }
      count_tenant_sales: {
        Args: { tenant_id_param: string }
        Returns: number
      }
      delete_product_with_admin_check: {
        Args: { admin_password: string; product_id: string }
        Returns: Json
      }
      get_auth_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_cashier_sales_summary: {
        Args: {
          cashier_name_param: string
          end_date_param?: string
          start_date_param?: string
          tenant_id_param: string
        }
        Returns: {
          payment_method: string
          sale_count: number
          total_amount: number
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
          cashier_name: string
          customer_name: string
          date: string
          item_id: string
          notes: string
          payment_method: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          sale_type: string
          total: number
        }[]
      }
      get_mesa_with_active_order: {
        Args: { mesa_id_param: string; tenant_id_param: string }
        Returns: {
          items_count: number
          mesa_nombre: string
          mesa_numero: number
          pedido_estado: string
          pedido_id: string
          total_pedido: number
        }[]
      }
      get_product_categories: {
        Args: { tenant_id_param: string }
        Returns: string[]
      }
      get_sales_by_cashier: {
        Args: {
          cashier_name_param: string
          end_date_param?: string
          start_date_param?: string
          tenant_id_param: string
        }
        Returns: {
          date: string
          id: string
          payment_method: string
          sale_type: string
          status: string
          total: number
        }[]
      }
      get_sales_by_payment_method: {
        Args: {
          end_date?: string
          start_date?: string
          tenant_id_param: string
        }
        Returns: {
          count: number
          payment_method: string
          total: number
        }[]
      }
      get_sales_with_details: {
        Args: {
          limit_param?: number
          offset_param?: number
          tenant_id_param: string
        }
        Returns: {
          cashier_name: string
          customer_id: string
          customer_name: string
          date: string
          id: string
          mixed_payment_details: Json
          payment_method: string
          sale_type: string
          status: string
          tenant_id: string
          total: number
        }[]
      }
      get_tenant_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_tenant_isolated_sales: {
        Args: { tenant_id_param: string }
        Returns: {
          cashier_name: string
          customer_id: string
          customer_name: string
          date: string
          id: string
          payment_method: string
          sale_type: string
          status: string
          tenant_id: string
          total: number
        }[]
      }
      get_turno_sales_by_payment_method: {
        Args: { turno_id_param: string }
        Returns: {
          count: number
          payment_method: string
          total: number
        }[]
      }
      get_turno_sales_by_payment_method_detailed: {
        Args: { turno_id_param: string }
        Returns: {
          count: number
          payment_method: string
          total: number
        }[]
      }
      log_tenant_security_event: {
        Args: {
          additional_info?: Json
          event_type: string
          table_name: string
          tenant_id_attempted: string
          tenant_id_current: string
        }
        Returns: undefined
      }
      validate_sales_integrity: {
        Args:
          | { days_back?: number; tenant_id_param: string }
          | { tenant_id_param?: string }
        Returns: {
          check_name: string
          details: Json
          issue_count: number
        }[]
      }
      validate_tenant_data_consistency: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          issue_type: string
          record_count: number
          table_name: string
        }[]
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
    Enums: {},
  },
} as const
