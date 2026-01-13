export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buyer?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  items?: OrderItem[];
  gift_options?: GiftOptions;
  delivery_schedule?: DeliverySchedule;
}

export interface GiftOptions {
  is_gift: boolean;
  message?: string;
  sender_name?: string;
  recipient_name?: string;
  wrap_style_id?: string;
  notification_type?: 'physical_card' | 'digital_sms' | 'digital_whatsapp';
  recipient_phone?: string;
}

export interface DeliverySchedule {
  scheduled_date: string; // ISO date string YYYY-MM-DD
  scheduled_slot: string; // e.g. "morning", "afternoon" or "14:00-16:00"
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  gift_message: string | null;
  created_at: string;
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