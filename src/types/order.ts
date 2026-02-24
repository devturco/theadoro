export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  recipient_name: string;
  recipient_phone: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | string | null;

  // Amounts
  subtotal?: number;
  shipping_cost?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;

  // Details
  shipping_address: string | ShippingAddress | null; // Can be JSON string in DB
  billing_address?: string | BillingAddress | null;
  notes: string | any | null; // JSON or text

  // Shipping info
  tracking_number?: string;
  estimated_delivery?: string;
  delivered_at?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  // Relations
  buyer?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url?: string;
  };
  seller?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url?: string;
  };
  items?: OrderItem[]; // Standardized name

  // Legacy/Specific fields to keep compatibility or future use
  gift_options?: GiftOptions;
  delivery_schedule?: DeliverySchedule;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  gift_message?: string | null;
  product?: {
    id: string;
    name: string;
    images: string[];
    seller_id?: string;
    price?: number;
    description?: string;
    profiles?: { // For service phone number
      full_name: string;
      phone: string;
    }
  };
  seller?: {
    id: string;
    full_name: string | null;
  };
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_this_month: number;
  revenue_this_month: number;
  growth_percentage: number;
}

export interface OrderFilters {
  buyer_id?: string;
  seller_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface GiftOptions {
  is_gift: boolean;
  message?: string;
  sender_name?: string;
  recipient_name?: string;
  wrap_style_id?: string;
  notification_type?: 'physical_card' | 'digital_sms' | 'digital_whatsapp';
  recipient_phone?: string;
  wrap_style_image?: string;
  wrap_style_name?: string;
}

export interface DeliverySchedule {
  scheduled_date: string;
  scheduled_slot: string;
}

export interface Appointment {
  id: string;
  buyer_id: string;
  product_id: string;
  seller_id: string;
  appointment_date: string;
  appointment_time: string;
  service_address: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyer?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  product?: {
    id: string;
    name: string;
    images: string[];
  };
  seller?: {
    id: string;
    full_name: string | null;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

import type { Product } from './product';