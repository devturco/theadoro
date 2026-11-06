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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          buyer_id: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          seller_id: string
          service_address: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          buyer_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          seller_id: string
          service_address: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          buyer_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          seller_id?: string
          service_address?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          campaign_id: string | null
          id: string
          joined_at: string | null
          seller_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          joined_at?: string | null
          seller_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          joined_at?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number
          ends_at: string
          id: string
          is_active: boolean | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expiration_date: string | null
          expires_at: string | null
          is_active: boolean | null
          min_purchase: number | null
          min_purchase_value: number | null
          seller_id: string | null
          updated_at: string | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expiration_date?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          min_purchase?: number | null
          min_purchase_value?: number | null
          seller_id?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiration_date?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          min_purchase?: number | null
          min_purchase_value?: number | null
          seller_id?: string | null
          updated_at?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
          time_range: string
        }
        Insert: {
          id: string
          is_active?: boolean | null
          name: string
          time_range: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
          time_range?: string
        }
        Relationships: []
      }
      gift_wraps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_wraps_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_wraps_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          gift_message: string | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          seller_id: string | null
          total_price: number | null
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          gift_message?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name?: string | null
          quantity: number
          seller_id?: string | null
          total_price?: number | null
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          gift_message?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          seller_id?: string | null
          total_price?: number | null
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          buyer_id: string | null
          created_at: string
          discount_amount: number | null
          gift_wrap_price: number | null
          id: string
          notes: Json | null
          payment_method: string | null
          seller_id: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          shipping_provider: string | null
          shipping_quote_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_amount: number | null
          tax_amount: number | null
          total_amount: number
          tracking_url: string | null
          uber_delivery_id: string | null
          uber_delivery_status: string | null
          uber_quote_id: string | null
          uber_tracking_url: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          buyer_id?: string | null
          created_at?: string
          discount_amount?: number | null
          gift_wrap_price?: number | null
          id?: string
          notes?: Json | null
          payment_method?: string | null
          seller_id?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_provider?: string | null
          shipping_quote_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount: number
          tracking_url?: string | null
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_quote_id?: string | null
          uber_tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          buyer_id?: string | null
          created_at?: string
          discount_amount?: number | null
          gift_wrap_price?: number | null
          id?: string
          notes?: Json | null
          payment_method?: string | null
          seller_id?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          shipping_provider?: string | null
          shipping_quote_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_amount?: number | null
          tax_amount?: number | null
          total_amount?: number
          tracking_url?: string | null
          uber_delivery_id?: string | null
          uber_delivery_status?: string | null
          uber_quote_id?: string | null
          uber_tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          payment_id: string | null
          processed_at: string | null
          provider: string
          provider_event_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          payment_id?: string | null
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          idempotency_key: string | null
          metadata: Json | null
          order_id: string
          provider: string
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_id: string
          provider: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          order_id?: string
          provider?: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          seller_id: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          seller_id?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          seller_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          created_at: string
          dimensions: string | null
          id: string
          price: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          dimensions?: string | null
          id?: string
          price?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          dimensions?: string | null
          id?: string
          price?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          display_id: number
          featured: boolean | null
          gender: string | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          is_service: boolean | null
          model: string | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          seller_id: string
          shipping_info: Json | null
          shipping_options: Json | null
          slug: string | null
          specifications: Json | null
          stock_quantity: number | null
          tags: string[] | null
          type: Database["public"]["Enums"]["product_type"]
          updated_at: string
          video_url: string | null
          warranty_info: Json | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_id?: number
          featured?: boolean | null
          gender?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_service?: boolean | null
          model?: string | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          seller_id: string
          shipping_info?: Json | null
          shipping_options?: Json | null
          slug?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          video_url?: string | null
          warranty_info?: Json | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_id?: number
          featured?: boolean | null
          gender?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_service?: boolean | null
          model?: string | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          seller_id?: string
          shipping_info?: Json | null
          shipping_options?: Json | null
          slug?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["product_type"]
          updated_at?: string
          video_url?: string | null
          warranty_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_categories"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_profiles"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_profiles"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean | null
          location: string | null
          max_installments: number | null
          neighborhood: string | null
          phone: string | null
          postal_code: string | null
          role: string | null
          seller_delivery_enabled: boolean | null
          state: string | null
          store_banner_url: string | null
          subscription_plan_id: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean | null
          location?: string | null
          max_installments?: number | null
          neighborhood?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          seller_delivery_enabled?: boolean | null
          state?: string | null
          store_banner_url?: string | null
          subscription_plan_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          location?: string | null
          max_installments?: number | null
          neighborhood?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          seller_delivery_enabled?: boolean | null
          state?: string | null
          store_banner_url?: string | null
          subscription_plan_id?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications: {
        Row: {
          accepted_legal_at: string | null
          accepted_legal_ip: string | null
          accepted_terms: boolean | null
          address: string
          address_complement: string | null
          address_number: string
          admin_notes: string | null
          birth_date: string | null
          chosen_plan_id: string | null
          city: string
          cnpj: string | null
          cnpj_doc_url: string | null
          company_name: string | null
          cpf: string | null
          created_at: string | null
          custom_category_suggestion: string | null
          full_name: string | null
          id: string
          id_back_url: string | null
          id_front_url: string | null
          neighborhood: string
          phone: string
          postal_code: string
          primary_category_id: string | null
          selfie_url: string | null
          state: string
          state_registration: string | null
          status:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          store_name: string
          trading_name: string | null
          type: Database["public"]["Enums"]["seller_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_legal_at?: string | null
          accepted_legal_ip?: string | null
          accepted_terms?: boolean | null
          address: string
          address_complement?: string | null
          address_number: string
          admin_notes?: string | null
          birth_date?: string | null
          chosen_plan_id?: string | null
          city: string
          cnpj?: string | null
          cnpj_doc_url?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          custom_category_suggestion?: string | null
          full_name?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          neighborhood: string
          phone: string
          postal_code: string
          primary_category_id?: string | null
          selfie_url?: string | null
          state: string
          state_registration?: string | null
          status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          store_name: string
          trading_name?: string | null
          type: Database["public"]["Enums"]["seller_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_legal_at?: string | null
          accepted_legal_ip?: string | null
          accepted_terms?: boolean | null
          address?: string
          address_complement?: string | null
          address_number?: string
          admin_notes?: string | null
          birth_date?: string | null
          chosen_plan_id?: string | null
          city?: string
          cnpj?: string | null
          cnpj_doc_url?: string | null
          company_name?: string | null
          cpf?: string | null
          created_at?: string | null
          custom_category_suggestion?: string | null
          full_name?: string | null
          id?: string
          id_back_url?: string | null
          id_front_url?: string | null
          neighborhood?: string
          phone?: string
          postal_code?: string
          primary_category_id?: string | null
          selfie_url?: string | null
          state?: string
          state_registration?: string | null
          status?:
            | Database["public"]["Enums"]["seller_application_status"]
            | null
          store_name?: string
          trading_name?: string | null
          type?: Database["public"]["Enums"]["seller_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_applications_chosen_plan_id_fkey"
            columns: ["chosen_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_applications_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          invoice_url: string | null
          paid_at: string | null
          payment_method: string | null
          pix_code: string | null
          pix_qr_url: string | null
          seller_id: string
          status: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_url?: string | null
          seller_id: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qr_url?: string | null
          seller_id?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_invoices_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_invoices_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "seller_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          seller_id: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          seller_id: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_subscriptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      service_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          product_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          product_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          product_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          section: string
          type: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          section: string
          type: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          section?: string
          type?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood: string
          number: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_stats_daily: {
        Row: {
          date: string | null
          product_id: string | null
          seller_id: string | null
          total_conversions: number | null
          total_views: number | null
          unique_views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_summary: {
        Row: {
          avatar: string | null
          banner: string | null
          description: string | null
          id: string | null
          is_seller: boolean | null
          joined_at: string | null
          location: string | null
          main_category: string | null
          name: string | null
          product_count: number | null
          rating: number | null
          review_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      exec_sql: { Args: { query: string }; Returns: undefined }
      get_coupons_columns: {
        Args: never
        Returns: {
          col: string
        }[]
      }
      get_my_profile_v2: {
        Args: never
        Returns: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean | null
          location: string | null
          max_installments: number | null
          neighborhood: string | null
          phone: string | null
          postal_code: string | null
          role: string | null
          seller_delivery_enabled: boolean | null
          state: string | null
          store_banner_url: string | null
          subscription_plan_id: string | null
          updated_at: string
          verified: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_roles: { Args: never; Returns: Json }
      get_profile_explicit: {
        Args: { target_id: string }
        Returns: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean | null
          location: string | null
          max_installments: number | null
          neighborhood: string | null
          phone: string | null
          postal_code: string | null
          role: string | null
          seller_delivery_enabled: boolean | null
          state: string | null
          store_banner_url: string | null
          subscription_plan_id: string | null
          updated_at: string
          verified: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_table_columns: { Args: { t_name: string }; Returns: Json }
      get_table_info: { Args: never; Returns: Json }
      get_user_debug_info: { Args: { p_email: string }; Returns: Json }
      get_user_roles_explicit: {
        Args: { target_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_order_seller_check: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      list_cols: { Args: never; Returns: string }
      slugify: { Args: { value: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "seller" | "buyer"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "approved" | "failed" | "refunded"
      product_type: "physical" | "service" | "digital"
      seller_application_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
      seller_type: "pf" | "pj"
      subscription_status: "active" | "past_due" | "canceled" | "trialing"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "seller", "buyer"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "approved", "failed", "refunded"],
      product_type: ["physical", "service", "digital"],
      seller_application_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
      ],
      seller_type: ["pf", "pj"],
      subscription_status: ["active", "past_due", "canceled", "trialing"],
    },
  },
} as const
