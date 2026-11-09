-- ============================================================================
-- BASELINE DO BANCO — gerado a partir do projeto em produção em 2026-11-09.
--
-- Este arquivo é a fonte de verdade do schema. As migrations antigas foram
-- movidas para supabase/migrations/archive/ e ficam apenas como histórico.
--
-- Todas as operações são idempotentes: pode rodar em projeto novo ou reparar
-- um banco existente sem apagar dados.
-- ============================================================================

set check_function_bodies = off;
set search_path = public;

-- ─────────────────────────────────────────────────────────────
-- Extensões
-- ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type public."app_role" as enum ('admin', 'seller', 'buyer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."appointment_status" as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."order_status" as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."payment_status" as enum ('pending', 'approved', 'failed', 'refunded');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."product_type" as enum ('physical', 'service', 'digital');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."seller_application_status" as enum ('pending', 'under_review', 'approved', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."seller_type" as enum ('pf', 'pj');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public."subscription_status" as enum ('active', 'past_due', 'canceled', 'trialing');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- Sequences
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public."product_display_id_seq" start with 1000 increment by 1;

-- ─────────────────────────────────────────────────────────────
-- Tabelas e colunas
-- ─────────────────────────────────────────────────────────────
create table if not exists public."appointments" (
  "id" uuid default gen_random_uuid() not null,
  "buyer_id" uuid not null,
  "product_id" uuid not null,
  "seller_id" uuid not null,
  "appointment_date" date not null,
  "appointment_time" time not null,
  "service_address" text not null,
  "status" public.appointment_status default 'pending'::appointment_status not null,
  "notes" text,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);
alter table public."appointments" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."appointments" add column if not exists "buyer_id" uuid;
alter table public."appointments" add column if not exists "product_id" uuid;
alter table public."appointments" add column if not exists "seller_id" uuid;
alter table public."appointments" add column if not exists "appointment_date" date;
alter table public."appointments" add column if not exists "appointment_time" time;
alter table public."appointments" add column if not exists "service_address" text;
alter table public."appointments" add column if not exists "status" public.appointment_status default 'pending'::appointment_status not null;
alter table public."appointments" add column if not exists "notes" text;
alter table public."appointments" add column if not exists "created_at" timestamptz default now() not null;
alter table public."appointments" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."campaign_participants" (
  "id" uuid default gen_random_uuid() not null,
  "campaign_id" uuid,
  "seller_id" uuid,
  "joined_at" timestamptz default now()
);
alter table public."campaign_participants" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."campaign_participants" add column if not exists "campaign_id" uuid;
alter table public."campaign_participants" add column if not exists "seller_id" uuid;
alter table public."campaign_participants" add column if not exists "joined_at" timestamptz default now();

create table if not exists public."campaigns" (
  "id" uuid default gen_random_uuid() not null,
  "title" text not null,
  "description" text,
  "discount_percentage" integer default 0 not null,
  "starts_at" timestamptz not null,
  "ends_at" timestamptz not null,
  "is_active" boolean default true,
  "created_at" timestamptz default now(),
  "free_shipping_enabled" boolean default false not null,
  "free_shipping_threshold" numeric(10,2)
);
alter table public."campaigns" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."campaigns" add column if not exists "title" text;
alter table public."campaigns" add column if not exists "description" text;
alter table public."campaigns" add column if not exists "discount_percentage" integer default 0 not null;
alter table public."campaigns" add column if not exists "starts_at" timestamptz;
alter table public."campaigns" add column if not exists "ends_at" timestamptz;
alter table public."campaigns" add column if not exists "is_active" boolean default true;
alter table public."campaigns" add column if not exists "created_at" timestamptz default now();
alter table public."campaigns" add column if not exists "free_shipping_enabled" boolean default false not null;
alter table public."campaigns" add column if not exists "free_shipping_threshold" numeric(10,2);

create table if not exists public."cart" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "product_id" uuid not null,
  "quantity" integer default 1 not null,
  "created_at" timestamptz default now() not null
);
alter table public."cart" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."cart" add column if not exists "user_id" uuid;
alter table public."cart" add column if not exists "product_id" uuid;
alter table public."cart" add column if not exists "quantity" integer default 1 not null;
alter table public."cart" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."categories" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "slug" text not null,
  "description" text,
  "image_url" text,
  "created_at" timestamptz default now() not null,
  "is_active" boolean default true,
  "updated_at" timestamptz default now(),
  "parent_id" uuid,
  "sort_order" integer default 0,
  "meta_title" text,
  "meta_description" text
);
alter table public."categories" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."categories" add column if not exists "name" text;
alter table public."categories" add column if not exists "slug" text;
alter table public."categories" add column if not exists "description" text;
alter table public."categories" add column if not exists "image_url" text;
alter table public."categories" add column if not exists "created_at" timestamptz default now() not null;
alter table public."categories" add column if not exists "is_active" boolean default true;
alter table public."categories" add column if not exists "updated_at" timestamptz default now();
alter table public."categories" add column if not exists "parent_id" uuid;
alter table public."categories" add column if not exists "sort_order" integer default 0;
alter table public."categories" add column if not exists "meta_title" text;
alter table public."categories" add column if not exists "meta_description" text;

create table if not exists public."coupons" (
  "code" text not null,
  "discount_type" text not null,
  "discount_value" numeric(10,2) not null,
  "min_purchase" numeric(10,2) default 0,
  "expiration_date" timestamptz,
  "usage_limit" integer,
  "used_count" integer default 0,
  "is_active" boolean default true,
  "created_at" timestamptz default now() not null,
  "seller_id" uuid,
  "expires_at" timestamptz,
  "updated_at" timestamptz default now(),
  "min_purchase_value" numeric(10,2) default 0
);
alter table public."coupons" add column if not exists "code" text;
alter table public."coupons" add column if not exists "discount_type" text;
alter table public."coupons" add column if not exists "discount_value" numeric(10,2);
alter table public."coupons" add column if not exists "min_purchase" numeric(10,2) default 0;
alter table public."coupons" add column if not exists "expiration_date" timestamptz;
alter table public."coupons" add column if not exists "usage_limit" integer;
alter table public."coupons" add column if not exists "used_count" integer default 0;
alter table public."coupons" add column if not exists "is_active" boolean default true;
alter table public."coupons" add column if not exists "created_at" timestamptz default now() not null;
alter table public."coupons" add column if not exists "seller_id" uuid;
alter table public."coupons" add column if not exists "expires_at" timestamptz;
alter table public."coupons" add column if not exists "updated_at" timestamptz default now();
alter table public."coupons" add column if not exists "min_purchase_value" numeric(10,2) default 0;

create table if not exists public."delivery_slots" (
  "id" text not null,
  "name" text not null,
  "time_range" text not null,
  "is_active" boolean default true
);
alter table public."delivery_slots" add column if not exists "id" text;
alter table public."delivery_slots" add column if not exists "name" text;
alter table public."delivery_slots" add column if not exists "time_range" text;
alter table public."delivery_slots" add column if not exists "is_active" boolean default true;

create table if not exists public."gift_list_items" (
  "id" uuid default gen_random_uuid() not null,
  "list_id" uuid not null,
  "product_id" uuid not null,
  "quantity_desired" integer default 1 not null,
  "quantity_purchased" integer default 0 not null,
  "created_at" timestamptz default now() not null
);
alter table public."gift_list_items" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."gift_list_items" add column if not exists "list_id" uuid;
alter table public."gift_list_items" add column if not exists "product_id" uuid;
alter table public."gift_list_items" add column if not exists "quantity_desired" integer default 1 not null;
alter table public."gift_list_items" add column if not exists "quantity_purchased" integer default 0 not null;
alter table public."gift_list_items" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."gift_lists" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "title" text not null,
  "description" text,
  "event_date" date,
  "is_public" boolean default true not null,
  "slug" text,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);
alter table public."gift_lists" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."gift_lists" add column if not exists "user_id" uuid;
alter table public."gift_lists" add column if not exists "title" text;
alter table public."gift_lists" add column if not exists "description" text;
alter table public."gift_lists" add column if not exists "event_date" date;
alter table public."gift_lists" add column if not exists "is_public" boolean default true not null;
alter table public."gift_lists" add column if not exists "slug" text;
alter table public."gift_lists" add column if not exists "created_at" timestamptz default now() not null;
alter table public."gift_lists" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."gift_wraps" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "description" text,
  "price" numeric(10,2) default 0 not null,
  "image_url" text,
  "is_active" boolean default true,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null,
  "seller_id" uuid
);
alter table public."gift_wraps" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."gift_wraps" add column if not exists "name" text;
alter table public."gift_wraps" add column if not exists "description" text;
alter table public."gift_wraps" add column if not exists "price" numeric(10,2) default 0 not null;
alter table public."gift_wraps" add column if not exists "image_url" text;
alter table public."gift_wraps" add column if not exists "is_active" boolean default true;
alter table public."gift_wraps" add column if not exists "created_at" timestamptz default now() not null;
alter table public."gift_wraps" add column if not exists "updated_at" timestamptz default now() not null;
alter table public."gift_wraps" add column if not exists "seller_id" uuid;

create table if not exists public."important_dates" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "title" text not null,
  "date" date not null,
  "type" text default 'other'::text not null,
  "notes" text,
  "created_at" timestamptz default now() not null
);
alter table public."important_dates" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."important_dates" add column if not exists "user_id" uuid;
alter table public."important_dates" add column if not exists "title" text;
alter table public."important_dates" add column if not exists "date" date;
alter table public."important_dates" add column if not exists "type" text default 'other'::text not null;
alter table public."important_dates" add column if not exists "notes" text;
alter table public."important_dates" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."order_items" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "product_id" uuid,
  "seller_id" uuid,
  "quantity" integer not null,
  "unit_price" numeric(10,2) not null,
  "product_name" text,
  "created_at" timestamptz default now() not null,
  "gift_message" text,
  "total_price" numeric,
  "variant_id" uuid
);
alter table public."order_items" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."order_items" add column if not exists "order_id" uuid;
alter table public."order_items" add column if not exists "product_id" uuid;
alter table public."order_items" add column if not exists "seller_id" uuid;
alter table public."order_items" add column if not exists "quantity" integer;
alter table public."order_items" add column if not exists "unit_price" numeric(10,2);
alter table public."order_items" add column if not exists "product_name" text;
alter table public."order_items" add column if not exists "created_at" timestamptz default now() not null;
alter table public."order_items" add column if not exists "gift_message" text;
alter table public."order_items" add column if not exists "total_price" numeric;
alter table public."order_items" add column if not exists "variant_id" uuid;

create table if not exists public."orders" (
  "id" uuid default gen_random_uuid() not null,
  "buyer_id" uuid,
  "total_amount" numeric(10,2) not null,
  "status" public.order_status default 'pending'::order_status not null,
  "shipping_address" jsonb,
  "billing_address" jsonb,
  "payment_method" text,
  "notes" jsonb,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null,
  "seller_id" uuid,
  "shipping_method" text,
  "shipping_cost" numeric default 0,
  "subtotal_amount" numeric(10,2) default 0,
  "gift_wrap_price" numeric(10,2) default 0,
  "discount_amount" numeric(10,2) default 0,
  "tax_amount" numeric(10,2) default 0,
  "uber_delivery_id" text,
  "uber_tracking_url" text,
  "uber_delivery_status" text,
  "uber_quote_id" text,
  "shipping_provider" text,
  "shipping_quote_id" text,
  "tracking_url" text
);
alter table public."orders" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."orders" add column if not exists "buyer_id" uuid;
alter table public."orders" add column if not exists "total_amount" numeric(10,2);
alter table public."orders" add column if not exists "status" public.order_status default 'pending'::order_status not null;
alter table public."orders" add column if not exists "shipping_address" jsonb;
alter table public."orders" add column if not exists "billing_address" jsonb;
alter table public."orders" add column if not exists "payment_method" text;
alter table public."orders" add column if not exists "notes" jsonb;
alter table public."orders" add column if not exists "created_at" timestamptz default now() not null;
alter table public."orders" add column if not exists "updated_at" timestamptz default now() not null;
alter table public."orders" add column if not exists "seller_id" uuid;
alter table public."orders" add column if not exists "shipping_method" text;
alter table public."orders" add column if not exists "shipping_cost" numeric default 0;
alter table public."orders" add column if not exists "subtotal_amount" numeric(10,2) default 0;
alter table public."orders" add column if not exists "gift_wrap_price" numeric(10,2) default 0;
alter table public."orders" add column if not exists "discount_amount" numeric(10,2) default 0;
alter table public."orders" add column if not exists "tax_amount" numeric(10,2) default 0;
alter table public."orders" add column if not exists "uber_delivery_id" text;
alter table public."orders" add column if not exists "uber_tracking_url" text;
alter table public."orders" add column if not exists "uber_delivery_status" text;
alter table public."orders" add column if not exists "uber_quote_id" text;
alter table public."orders" add column if not exists "shipping_provider" text;
alter table public."orders" add column if not exists "shipping_quote_id" text;
alter table public."orders" add column if not exists "tracking_url" text;

create table if not exists public."payment_events" (
  "id" uuid default gen_random_uuid() not null,
  "payment_id" uuid,
  "order_id" uuid,
  "provider" text not null,
  "event_type" text not null,
  "provider_event_id" text,
  "payload" jsonb default '{}'::jsonb not null,
  "processed_at" timestamptz,
  "created_at" timestamptz default now() not null
);
alter table public."payment_events" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."payment_events" add column if not exists "payment_id" uuid;
alter table public."payment_events" add column if not exists "order_id" uuid;
alter table public."payment_events" add column if not exists "provider" text;
alter table public."payment_events" add column if not exists "event_type" text;
alter table public."payment_events" add column if not exists "provider_event_id" text;
alter table public."payment_events" add column if not exists "payload" jsonb default '{}'::jsonb not null;
alter table public."payment_events" add column if not exists "processed_at" timestamptz;
alter table public."payment_events" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."payments" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "provider" text not null,
  "provider_transaction_id" text,
  "amount" numeric(10,2) not null,
  "status" public.payment_status default 'pending'::payment_status,
  "metadata" jsonb,
  "created_at" timestamptz default now() not null,
  "idempotency_key" text,
  "updated_at" timestamptz default now() not null
);
alter table public."payments" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."payments" add column if not exists "order_id" uuid;
alter table public."payments" add column if not exists "provider" text;
alter table public."payments" add column if not exists "provider_transaction_id" text;
alter table public."payments" add column if not exists "amount" numeric(10,2);
alter table public."payments" add column if not exists "status" public.payment_status default 'pending'::payment_status;
alter table public."payments" add column if not exists "metadata" jsonb;
alter table public."payments" add column if not exists "created_at" timestamptz default now() not null;
alter table public."payments" add column if not exists "idempotency_key" text;
alter table public."payments" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."product_analytics" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid,
  "seller_id" uuid,
  "event_type" text not null,
  "session_id" text,
  "metadata" jsonb default '{}'::jsonb,
  "created_at" timestamptz default timezone('utc'::text, now()) not null
);
alter table public."product_analytics" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."product_analytics" add column if not exists "product_id" uuid;
alter table public."product_analytics" add column if not exists "seller_id" uuid;
alter table public."product_analytics" add column if not exists "event_type" text;
alter table public."product_analytics" add column if not exists "session_id" text;
alter table public."product_analytics" add column if not exists "metadata" jsonb default '{}'::jsonb;
alter table public."product_analytics" add column if not exists "created_at" timestamptz default timezone('utc'::text, now()) not null;

create table if not exists public."product_variations" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid not null,
  "sku" text,
  "color" text,
  "size" text,
  "dimensions" text,
  "weight" numeric(10,3),
  "price" numeric(10,2),
  "stock_quantity" integer default 0,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);
alter table public."product_variations" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."product_variations" add column if not exists "product_id" uuid;
alter table public."product_variations" add column if not exists "sku" text;
alter table public."product_variations" add column if not exists "color" text;
alter table public."product_variations" add column if not exists "size" text;
alter table public."product_variations" add column if not exists "dimensions" text;
alter table public."product_variations" add column if not exists "weight" numeric(10,3);
alter table public."product_variations" add column if not exists "price" numeric(10,2);
alter table public."product_variations" add column if not exists "stock_quantity" integer default 0;
alter table public."product_variations" add column if not exists "created_at" timestamptz default now() not null;
alter table public."product_variations" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."products" (
  "id" uuid default gen_random_uuid() not null,
  "seller_id" uuid not null,
  "category_id" uuid,
  "name" text not null,
  "description" text,
  "price" numeric(10,2) not null,
  "type" public.product_type default 'physical'::product_type not null,
  "stock_quantity" integer default 0,
  "images" text[] default '{}'::text[],
  "is_active" boolean default true,
  "featured" boolean default false,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null,
  "original_price" numeric,
  "rating" numeric default 0,
  "review_count" integer default 0,
  "in_stock" boolean default true,
  "tags" text[] default '{}'::text[],
  "is_service" boolean default false,
  "slug" text,
  "brand" text,
  "model" text,
  "gender" text,
  "video_url" text,
  "warranty_info" jsonb,
  "specifications" jsonb,
  "shipping_info" jsonb,
  "shipping_options" jsonb,
  "display_id" bigint default nextval('product_display_id_seq'::regclass) not null
);
alter table public."products" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."products" add column if not exists "seller_id" uuid;
alter table public."products" add column if not exists "category_id" uuid;
alter table public."products" add column if not exists "name" text;
alter table public."products" add column if not exists "description" text;
alter table public."products" add column if not exists "price" numeric(10,2);
alter table public."products" add column if not exists "type" public.product_type default 'physical'::product_type not null;
alter table public."products" add column if not exists "stock_quantity" integer default 0;
alter table public."products" add column if not exists "images" text[] default '{}'::text[];
alter table public."products" add column if not exists "is_active" boolean default true;
alter table public."products" add column if not exists "featured" boolean default false;
alter table public."products" add column if not exists "created_at" timestamptz default now() not null;
alter table public."products" add column if not exists "updated_at" timestamptz default now() not null;
alter table public."products" add column if not exists "original_price" numeric;
alter table public."products" add column if not exists "rating" numeric default 0;
alter table public."products" add column if not exists "review_count" integer default 0;
alter table public."products" add column if not exists "in_stock" boolean default true;
alter table public."products" add column if not exists "tags" text[] default '{}'::text[];
alter table public."products" add column if not exists "is_service" boolean default false;
alter table public."products" add column if not exists "slug" text;
alter table public."products" add column if not exists "brand" text;
alter table public."products" add column if not exists "model" text;
alter table public."products" add column if not exists "gender" text;
alter table public."products" add column if not exists "video_url" text;
alter table public."products" add column if not exists "warranty_info" jsonb;
alter table public."products" add column if not exists "specifications" jsonb;
alter table public."products" add column if not exists "shipping_info" jsonb;
alter table public."products" add column if not exists "shipping_options" jsonb;
alter table public."products" add column if not exists "display_id" bigint default nextval('product_display_id_seq'::regclass) not null;

create table if not exists public."profiles" (
  "id" uuid not null,
  "email" text not null,
  "full_name" text,
  "phone" text,
  "avatar_url" text,
  "bio" text,
  "city" text,
  "state" text,
  "address" text,
  "postal_code" text,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null,
  "role" text default 'buyer'::text,
  "birth_date" date,
  "address_number" text,
  "address_complement" text,
  "neighborhood" text,
  "store_banner_url" text,
  "seller_delivery_enabled" boolean default false,
  "verified" boolean default false,
  "subscription_plan_id" uuid,
  "max_installments" integer default 12,
  "location" text,
  "is_approved" boolean default false
);
alter table public."profiles" add column if not exists "id" uuid;
alter table public."profiles" add column if not exists "email" text;
alter table public."profiles" add column if not exists "full_name" text;
alter table public."profiles" add column if not exists "phone" text;
alter table public."profiles" add column if not exists "avatar_url" text;
alter table public."profiles" add column if not exists "bio" text;
alter table public."profiles" add column if not exists "city" text;
alter table public."profiles" add column if not exists "state" text;
alter table public."profiles" add column if not exists "address" text;
alter table public."profiles" add column if not exists "postal_code" text;
alter table public."profiles" add column if not exists "created_at" timestamptz default now() not null;
alter table public."profiles" add column if not exists "updated_at" timestamptz default now() not null;
alter table public."profiles" add column if not exists "role" text default 'buyer'::text;
alter table public."profiles" add column if not exists "birth_date" date;
alter table public."profiles" add column if not exists "address_number" text;
alter table public."profiles" add column if not exists "address_complement" text;
alter table public."profiles" add column if not exists "neighborhood" text;
alter table public."profiles" add column if not exists "store_banner_url" text;
alter table public."profiles" add column if not exists "seller_delivery_enabled" boolean default false;
alter table public."profiles" add column if not exists "verified" boolean default false;
alter table public."profiles" add column if not exists "subscription_plan_id" uuid;
alter table public."profiles" add column if not exists "max_installments" integer default 12;
alter table public."profiles" add column if not exists "location" text;
alter table public."profiles" add column if not exists "is_approved" boolean default false;

create table if not exists public."reviews" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid not null,
  "buyer_id" uuid not null,
  "rating" integer not null,
  "comment" text,
  "created_at" timestamptz default now() not null
);
alter table public."reviews" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."reviews" add column if not exists "product_id" uuid;
alter table public."reviews" add column if not exists "buyer_id" uuid;
alter table public."reviews" add column if not exists "rating" integer;
alter table public."reviews" add column if not exists "comment" text;
alter table public."reviews" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."seller_applications" (
  "id" uuid default extensions.uuid_generate_v4() not null,
  "user_id" uuid not null,
  "store_name" text not null,
  "primary_category_id" uuid,
  "custom_category_suggestion" text,
  "type" public.seller_type not null,
  "full_name" text,
  "cpf" text,
  "birth_date" date,
  "company_name" text,
  "trading_name" text,
  "cnpj" text,
  "state_registration" text,
  "phone" text not null,
  "address" text not null,
  "address_number" text not null,
  "address_complement" text,
  "neighborhood" text not null,
  "city" text not null,
  "state" text not null,
  "postal_code" text not null,
  "id_front_url" text,
  "id_back_url" text,
  "selfie_url" text,
  "cnpj_doc_url" text,
  "status" public.seller_application_status default 'pending'::seller_application_status,
  "admin_notes" text,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now(),
  "accepted_terms" boolean default false,
  "accepted_legal_at" timestamptz,
  "accepted_legal_ip" text,
  "chosen_plan_id" uuid
);
alter table public."seller_applications" add column if not exists "id" uuid default extensions.uuid_generate_v4() not null;
alter table public."seller_applications" add column if not exists "user_id" uuid;
alter table public."seller_applications" add column if not exists "store_name" text;
alter table public."seller_applications" add column if not exists "primary_category_id" uuid;
alter table public."seller_applications" add column if not exists "custom_category_suggestion" text;
alter table public."seller_applications" add column if not exists "type" public.seller_type;
alter table public."seller_applications" add column if not exists "full_name" text;
alter table public."seller_applications" add column if not exists "cpf" text;
alter table public."seller_applications" add column if not exists "birth_date" date;
alter table public."seller_applications" add column if not exists "company_name" text;
alter table public."seller_applications" add column if not exists "trading_name" text;
alter table public."seller_applications" add column if not exists "cnpj" text;
alter table public."seller_applications" add column if not exists "state_registration" text;
alter table public."seller_applications" add column if not exists "phone" text;
alter table public."seller_applications" add column if not exists "address" text;
alter table public."seller_applications" add column if not exists "address_number" text;
alter table public."seller_applications" add column if not exists "address_complement" text;
alter table public."seller_applications" add column if not exists "neighborhood" text;
alter table public."seller_applications" add column if not exists "city" text;
alter table public."seller_applications" add column if not exists "state" text;
alter table public."seller_applications" add column if not exists "postal_code" text;
alter table public."seller_applications" add column if not exists "id_front_url" text;
alter table public."seller_applications" add column if not exists "id_back_url" text;
alter table public."seller_applications" add column if not exists "selfie_url" text;
alter table public."seller_applications" add column if not exists "cnpj_doc_url" text;
alter table public."seller_applications" add column if not exists "status" public.seller_application_status default 'pending'::seller_application_status;
alter table public."seller_applications" add column if not exists "admin_notes" text;
alter table public."seller_applications" add column if not exists "created_at" timestamptz default now();
alter table public."seller_applications" add column if not exists "updated_at" timestamptz default now();
alter table public."seller_applications" add column if not exists "accepted_terms" boolean default false;
alter table public."seller_applications" add column if not exists "accepted_legal_at" timestamptz;
alter table public."seller_applications" add column if not exists "accepted_legal_ip" text;
alter table public."seller_applications" add column if not exists "chosen_plan_id" uuid;

create table if not exists public."seller_invoices" (
  "id" uuid default gen_random_uuid() not null,
  "seller_id" uuid not null,
  "subscription_id" uuid,
  "amount" numeric(10,2) not null,
  "status" text default 'pending'::text not null,
  "payment_method" text,
  "due_date" timestamptz not null,
  "paid_at" timestamptz,
  "invoice_url" text,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now(),
  "pix_code" text,
  "pix_qr_url" text
);
alter table public."seller_invoices" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."seller_invoices" add column if not exists "seller_id" uuid;
alter table public."seller_invoices" add column if not exists "subscription_id" uuid;
alter table public."seller_invoices" add column if not exists "amount" numeric(10,2);
alter table public."seller_invoices" add column if not exists "status" text default 'pending'::text not null;
alter table public."seller_invoices" add column if not exists "payment_method" text;
alter table public."seller_invoices" add column if not exists "due_date" timestamptz;
alter table public."seller_invoices" add column if not exists "paid_at" timestamptz;
alter table public."seller_invoices" add column if not exists "invoice_url" text;
alter table public."seller_invoices" add column if not exists "created_at" timestamptz default now();
alter table public."seller_invoices" add column if not exists "updated_at" timestamptz default now();
alter table public."seller_invoices" add column if not exists "pix_code" text;
alter table public."seller_invoices" add column if not exists "pix_qr_url" text;

create table if not exists public."seller_subscriptions" (
  "id" uuid default gen_random_uuid() not null,
  "seller_id" uuid not null,
  "plan_id" uuid not null,
  "status" public.subscription_status default 'active'::subscription_status,
  "current_period_start" timestamptz default now(),
  "current_period_end" timestamptz,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);
alter table public."seller_subscriptions" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."seller_subscriptions" add column if not exists "seller_id" uuid;
alter table public."seller_subscriptions" add column if not exists "plan_id" uuid;
alter table public."seller_subscriptions" add column if not exists "status" public.subscription_status default 'active'::subscription_status;
alter table public."seller_subscriptions" add column if not exists "current_period_start" timestamptz default now();
alter table public."seller_subscriptions" add column if not exists "current_period_end" timestamptz;
alter table public."seller_subscriptions" add column if not exists "created_at" timestamptz default now() not null;
alter table public."seller_subscriptions" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."service_availability" (
  "id" uuid default gen_random_uuid() not null,
  "product_id" uuid not null,
  "day_of_week" integer not null,
  "start_time" time not null,
  "end_time" time not null,
  "created_at" timestamptz default now() not null
);
alter table public."service_availability" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."service_availability" add column if not exists "product_id" uuid;
alter table public."service_availability" add column if not exists "day_of_week" integer;
alter table public."service_availability" add column if not exists "start_time" time;
alter table public."service_availability" add column if not exists "end_time" time;
alter table public."service_availability" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."site_settings" (
  "id" uuid default gen_random_uuid() not null,
  "section" text not null,
  "key" text not null,
  "value" jsonb not null,
  "label" text not null,
  "type" text not null,
  "created_at" timestamptz default timezone('utc'::text, now()) not null,
  "updated_at" timestamptz default timezone('utc'::text, now()) not null
);
alter table public."site_settings" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."site_settings" add column if not exists "section" text;
alter table public."site_settings" add column if not exists "key" text;
alter table public."site_settings" add column if not exists "value" jsonb;
alter table public."site_settings" add column if not exists "label" text;
alter table public."site_settings" add column if not exists "type" text;
alter table public."site_settings" add column if not exists "created_at" timestamptz default timezone('utc'::text, now()) not null;
alter table public."site_settings" add column if not exists "updated_at" timestamptz default timezone('utc'::text, now()) not null;

create table if not exists public."subscription_plans" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "description" text,
  "price" numeric(10,2) default 0 not null,
  "features" jsonb default '[]'::jsonb,
  "limits" jsonb default '{}'::jsonb,
  "is_active" boolean default true,
  "created_at" timestamptz default now() not null
);
alter table public."subscription_plans" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."subscription_plans" add column if not exists "name" text;
alter table public."subscription_plans" add column if not exists "description" text;
alter table public."subscription_plans" add column if not exists "price" numeric(10,2) default 0 not null;
alter table public."subscription_plans" add column if not exists "features" jsonb default '[]'::jsonb;
alter table public."subscription_plans" add column if not exists "limits" jsonb default '{}'::jsonb;
alter table public."subscription_plans" add column if not exists "is_active" boolean default true;
alter table public."subscription_plans" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."user_addresses" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "label" text,
  "zip_code" text not null,
  "street" text not null,
  "number" text not null,
  "complement" text,
  "neighborhood" text not null,
  "city" text not null,
  "state" text not null,
  "is_default" boolean default false,
  "created_at" timestamptz default now() not null,
  "updated_at" timestamptz default now() not null
);
alter table public."user_addresses" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."user_addresses" add column if not exists "user_id" uuid;
alter table public."user_addresses" add column if not exists "label" text;
alter table public."user_addresses" add column if not exists "zip_code" text;
alter table public."user_addresses" add column if not exists "street" text;
alter table public."user_addresses" add column if not exists "number" text;
alter table public."user_addresses" add column if not exists "complement" text;
alter table public."user_addresses" add column if not exists "neighborhood" text;
alter table public."user_addresses" add column if not exists "city" text;
alter table public."user_addresses" add column if not exists "state" text;
alter table public."user_addresses" add column if not exists "is_default" boolean default false;
alter table public."user_addresses" add column if not exists "created_at" timestamptz default now() not null;
alter table public."user_addresses" add column if not exists "updated_at" timestamptz default now() not null;

create table if not exists public."user_roles" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "role" public.app_role not null,
  "created_at" timestamptz default now() not null
);
alter table public."user_roles" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."user_roles" add column if not exists "user_id" uuid;
alter table public."user_roles" add column if not exists "role" public.app_role;
alter table public."user_roles" add column if not exists "created_at" timestamptz default now() not null;

create table if not exists public."wishlist" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "product_id" uuid not null,
  "created_at" timestamptz default now() not null
);
alter table public."wishlist" add column if not exists "id" uuid default gen_random_uuid() not null;
alter table public."wishlist" add column if not exists "user_id" uuid;
alter table public."wishlist" add column if not exists "product_id" uuid;
alter table public."wishlist" add column if not exists "created_at" timestamptz default now() not null;

-- ─────────────────────────────────────────────────────────────
-- Constraints
-- ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and (conname = 'appointments_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."appointments" add constraint "appointments_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_participants'::regclass
      and (conname = 'campaign_participants_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."campaign_participants" add constraint "campaign_participants_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaigns'::regclass
      and (conname = 'campaigns_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."campaigns" add constraint "campaigns_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart'::regclass
      and (conname = 'cart_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."cart" add constraint "cart_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and (conname = 'categories_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."categories" add constraint "categories_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coupons'::regclass
      and (conname = 'coupons_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (code)$cdef$)
  ) then
    alter table public."coupons" add constraint "coupons_pkey" PRIMARY KEY (code);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.delivery_slots'::regclass
      and (conname = 'delivery_slots_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."delivery_slots" add constraint "delivery_slots_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_list_items'::regclass
      and (conname = 'gift_list_items_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."gift_list_items" add constraint "gift_list_items_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_lists'::regclass
      and (conname = 'gift_lists_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."gift_lists" add constraint "gift_lists_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_wraps'::regclass
      and (conname = 'gift_wraps_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."gift_wraps" add constraint "gift_wraps_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.important_dates'::regclass
      and (conname = 'important_dates_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."important_dates" add constraint "important_dates_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and (conname = 'orders_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."orders" add constraint "orders_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payment_events'::regclass
      and (conname = 'payment_events_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."payment_events" add constraint "payment_events_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payments'::regclass
      and (conname = 'payments_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."payments" add constraint "payments_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_analytics'::regclass
      and (conname = 'product_analytics_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."product_analytics" add constraint "product_analytics_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_variations'::regclass
      and (conname = 'product_variations_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."product_variations" add constraint "product_variations_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'products_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."products" add constraint "products_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and (conname = 'profiles_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and (conname = 'reviews_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."reviews" add constraint "reviews_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_applications'::regclass
      and (conname = 'seller_applications_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."seller_applications" add constraint "seller_applications_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_invoices'::regclass
      and (conname = 'seller_invoices_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."seller_invoices" add constraint "seller_invoices_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_subscriptions'::regclass
      and (conname = 'seller_subscriptions_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."seller_subscriptions" add constraint "seller_subscriptions_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.service_availability'::regclass
      and (conname = 'service_availability_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."service_availability" add constraint "service_availability_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.site_settings'::regclass
      and (conname = 'site_settings_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."site_settings" add constraint "site_settings_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.subscription_plans'::regclass
      and (conname = 'subscription_plans_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_addresses'::regclass
      and (conname = 'user_addresses_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."user_addresses" add constraint "user_addresses_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_roles'::regclass
      and (conname = 'user_roles_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."user_roles" add constraint "user_roles_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.wishlist'::regclass
      and (conname = 'wishlist_pkey' or pg_get_constraintdef(oid) = $cdef$PRIMARY KEY (id)$cdef$)
  ) then
    alter table public."wishlist" add constraint "wishlist_pkey" PRIMARY KEY (id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_participants'::regclass
      and (conname = 'campaign_participants_campaign_id_seller_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (campaign_id, seller_id)$cdef$)
  ) then
    alter table public."campaign_participants" add constraint "campaign_participants_campaign_id_seller_id_key" UNIQUE (campaign_id, seller_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart'::regclass
      and (conname = 'cart_user_id_product_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (user_id, product_id)$cdef$)
  ) then
    alter table public."cart" add constraint "cart_user_id_product_id_key" UNIQUE (user_id, product_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and (conname = 'categories_name_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (name)$cdef$)
  ) then
    alter table public."categories" add constraint "categories_name_key" UNIQUE (name);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and (conname = 'categories_slug_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (slug)$cdef$)
  ) then
    alter table public."categories" add constraint "categories_slug_key" UNIQUE (slug);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_lists'::regclass
      and (conname = 'gift_lists_slug_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (slug)$cdef$)
  ) then
    alter table public."gift_lists" add constraint "gift_lists_slug_key" UNIQUE (slug);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_variations'::regclass
      and (conname = 'product_variations_sku_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (sku)$cdef$)
  ) then
    alter table public."product_variations" add constraint "product_variations_sku_key" UNIQUE (sku);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'products_display_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (display_id)$cdef$)
  ) then
    alter table public."products" add constraint "products_display_id_key" UNIQUE (display_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and (conname = 'reviews_product_id_buyer_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (product_id, buyer_id)$cdef$)
  ) then
    alter table public."reviews" add constraint "reviews_product_id_buyer_id_key" UNIQUE (product_id, buyer_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_subscriptions'::regclass
      and (conname = 'seller_subscriptions_seller_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (seller_id)$cdef$)
  ) then
    alter table public."seller_subscriptions" add constraint "seller_subscriptions_seller_id_key" UNIQUE (seller_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.site_settings'::regclass
      and (conname = 'site_settings_key_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (key)$cdef$)
  ) then
    alter table public."site_settings" add constraint "site_settings_key_key" UNIQUE (key);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.site_settings'::regclass
      and (conname = 'site_settings_section_key_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (section, key)$cdef$)
  ) then
    alter table public."site_settings" add constraint "site_settings_section_key_key" UNIQUE (section, key);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_roles'::regclass
      and (conname = 'user_roles_user_id_role_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (user_id, role)$cdef$)
  ) then
    alter table public."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE (user_id, role);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.wishlist'::regclass
      and (conname = 'wishlist_user_id_product_id_key' or pg_get_constraintdef(oid) = $cdef$UNIQUE (user_id, product_id)$cdef$)
  ) then
    alter table public."wishlist" add constraint "wishlist_user_id_product_id_key" UNIQUE (user_id, product_id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart'::regclass
      and (conname = 'cart_quantity_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((quantity > 0))$cdef$)
  ) then
    alter table public."cart" add constraint "cart_quantity_check" CHECK ((quantity > 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coupons'::regclass
      and (conname = 'coupons_discount_type_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))$cdef$)
  ) then
    alter table public."coupons" add constraint "coupons_discount_type_check" CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coupons'::regclass
      and (conname = 'coupons_discount_value_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((discount_value > (0)::numeric))$cdef$)
  ) then
    alter table public."coupons" add constraint "coupons_discount_value_check" CHECK ((discount_value > (0)::numeric));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_list_items'::regclass
      and (conname = 'gift_list_items_quantity_desired_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((quantity_desired > 0))$cdef$)
  ) then
    alter table public."gift_list_items" add constraint "gift_list_items_quantity_desired_check" CHECK ((quantity_desired > 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_list_items'::regclass
      and (conname = 'gift_list_items_quantity_purchased_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((quantity_purchased >= 0))$cdef$)
  ) then
    alter table public."gift_list_items" add constraint "gift_list_items_quantity_purchased_check" CHECK ((quantity_purchased >= 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.important_dates'::regclass
      and (conname = 'important_dates_type_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'holiday'::text, 'other'::text])))$cdef$)
  ) then
    alter table public."important_dates" add constraint "important_dates_type_check" CHECK ((type = ANY (ARRAY['birthday'::text, 'anniversary'::text, 'holiday'::text, 'other'::text])));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_quantity_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((quantity > 0))$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_quantity_check" CHECK ((quantity > 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_unit_price_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((unit_price >= (0)::numeric))$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_unit_price_check" CHECK ((unit_price >= (0)::numeric));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and (conname = 'orders_total_amount_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((total_amount >= (0)::numeric))$cdef$)
  ) then
    alter table public."orders" add constraint "orders_total_amount_check" CHECK ((total_amount >= (0)::numeric));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_variations'::regclass
      and (conname = 'product_variations_stock_quantity_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((stock_quantity >= 0))$cdef$)
  ) then
    alter table public."product_variations" add constraint "product_variations_stock_quantity_check" CHECK ((stock_quantity >= 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'products_price_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((price >= (0)::numeric))$cdef$)
  ) then
    alter table public."products" add constraint "products_price_check" CHECK ((price >= (0)::numeric));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'products_stock_quantity_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((stock_quantity >= 0))$cdef$)
  ) then
    alter table public."products" add constraint "products_stock_quantity_check" CHECK ((stock_quantity >= 0));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and (conname = 'reviews_rating_check' or pg_get_constraintdef(oid) = $cdef$CHECK (((rating >= 1) AND (rating <= 5)))$cdef$)
  ) then
    alter table public."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.service_availability'::regclass
      and (conname = 'service_availability_day_of_week_check' or pg_get_constraintdef(oid) = $cdef$CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))$cdef$)
  ) then
    alter table public."service_availability" add constraint "service_availability_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.site_settings'::regclass
      and (conname = 'site_settings_type_check' or pg_get_constraintdef(oid) = $cdef$CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'number'::text, 'boolean'::text, 'color'::text, 'image_array'::text])))$cdef$)
  ) then
    alter table public."site_settings" add constraint "site_settings_type_check" CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'number'::text, 'boolean'::text, 'color'::text, 'image_array'::text])));
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and (conname = 'appointments_buyer_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."appointments" add constraint "appointments_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and (conname = 'appointments_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."appointments" add constraint "appointments_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and (conname = 'appointments_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."appointments" add constraint "appointments_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_participants'::regclass
      and (conname = 'campaign_participants_campaign_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."campaign_participants" add constraint "campaign_participants_campaign_id_fkey" FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_participants'::regclass
      and (conname = 'campaign_participants_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."campaign_participants" add constraint "campaign_participants_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart'::regclass
      and (conname = 'cart_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."cart" add constraint "cart_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cart'::regclass
      and (conname = 'cart_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."cart" add constraint "cart_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and (conname = 'categories_parent_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.coupons'::regclass
      and (conname = 'coupons_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."coupons" add constraint "coupons_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_list_items'::regclass
      and (conname = 'gift_list_items_list_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (list_id) REFERENCES gift_lists(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."gift_list_items" add constraint "gift_list_items_list_id_fkey" FOREIGN KEY (list_id) REFERENCES gift_lists(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_list_items'::regclass
      and (conname = 'gift_list_items_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."gift_list_items" add constraint "gift_list_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_lists'::regclass
      and (conname = 'gift_lists_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."gift_lists" add constraint "gift_lists_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gift_wraps'::regclass
      and (conname = 'gift_wraps_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id)$cdef$)
  ) then
    alter table public."gift_wraps" add constraint "gift_wraps_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.important_dates'::regclass
      and (conname = 'important_dates_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."important_dates" add constraint "important_dates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_order_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_items'::regclass
      and (conname = 'order_items_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."order_items" add constraint "order_items_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and (conname = 'orders_buyer_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."orders" add constraint "orders_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and (conname = 'orders_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id)$cdef$)
  ) then
    alter table public."orders" add constraint "orders_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payment_events'::regclass
      and (conname = 'payment_events_order_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."payment_events" add constraint "payment_events_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payment_events'::regclass
      and (conname = 'payment_events_payment_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."payment_events" add constraint "payment_events_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.payments'::regclass
      and (conname = 'payments_order_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."payments" add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_analytics'::regclass
      and (conname = 'product_analytics_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."product_analytics" add constraint "product_analytics_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_analytics'::regclass
      and (conname = 'product_analytics_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."product_analytics" add constraint "product_analytics_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.product_variations'::regclass
      and (conname = 'product_variations_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."product_variations" add constraint "product_variations_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'fk_products_categories' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."products" add constraint "fk_products_categories" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and (conname = 'fk_products_profiles' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL$cdef$)
  ) then
    alter table public."products" add constraint "fk_products_profiles" FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and (conname = 'profiles_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and (conname = 'profiles_subscription_plan_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)$cdef$)
  ) then
    alter table public."profiles" add constraint "profiles_subscription_plan_id_fkey" FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and (conname = 'reviews_buyer_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."reviews" add constraint "reviews_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and (conname = 'reviews_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."reviews" add constraint "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_applications'::regclass
      and (conname = 'seller_applications_chosen_plan_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (chosen_plan_id) REFERENCES subscription_plans(id)$cdef$)
  ) then
    alter table public."seller_applications" add constraint "seller_applications_chosen_plan_id_fkey" FOREIGN KEY (chosen_plan_id) REFERENCES subscription_plans(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_applications'::regclass
      and (conname = 'seller_applications_primary_category_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (primary_category_id) REFERENCES categories(id)$cdef$)
  ) then
    alter table public."seller_applications" add constraint "seller_applications_primary_category_id_fkey" FOREIGN KEY (primary_category_id) REFERENCES categories(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_applications'::regclass
      and (conname = 'seller_applications_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id)$cdef$)
  ) then
    alter table public."seller_applications" add constraint "seller_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_invoices'::regclass
      and (conname = 'seller_invoices_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id)$cdef$)
  ) then
    alter table public."seller_invoices" add constraint "seller_invoices_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_invoices'::regclass
      and (conname = 'seller_invoices_subscription_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (subscription_id) REFERENCES seller_subscriptions(id)$cdef$)
  ) then
    alter table public."seller_invoices" add constraint "seller_invoices_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES seller_subscriptions(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_subscriptions'::regclass
      and (conname = 'seller_subscriptions_plan_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)$cdef$)
  ) then
    alter table public."seller_subscriptions" add constraint "seller_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.seller_subscriptions'::regclass
      and (conname = 'seller_subscriptions_seller_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (seller_id) REFERENCES profiles(id)$cdef$)
  ) then
    alter table public."seller_subscriptions" add constraint "seller_subscriptions_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES profiles(id);
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.service_availability'::regclass
      and (conname = 'service_availability_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."service_availability" add constraint "service_availability_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_addresses'::regclass
      and (conname = 'user_addresses_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."user_addresses" add constraint "user_addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_roles'::regclass
      and (conname = 'user_roles_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.wishlist'::regclass
      and (conname = 'wishlist_product_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."wishlist" add constraint "wishlist_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  end if;
end $$;
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.wishlist'::regclass
      and (conname = 'wishlist_user_id_fkey' or pg_get_constraintdef(oid) = $cdef$FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE$cdef$)
  ) then
    alter table public."wishlist" add constraint "wishlist_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_user_ids ON public.appointments USING btree (buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_gift_wraps_seller_id ON public.gift_wraps USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON public.order_items USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_uber_delivery_id ON public.orders USING btree (uber_delivery_id);
CREATE INDEX IF NOT EXISTS orders_uber_delivery_id_idx ON public.orders USING btree (uber_delivery_id);
CREATE INDEX IF NOT EXISTS payment_events_order_id_idx ON public.payment_events USING btree (order_id);
CREATE INDEX IF NOT EXISTS payment_events_payment_id_idx ON public.payment_events USING btree (payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_provider_event_unique ON public.payment_events USING btree (provider, provider_event_id) WHERE (provider_event_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_unique ON public.payments USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON public.payments USING btree (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_transaction_unique ON public.payments USING btree (provider, provider_transaction_id) WHERE (provider_transaction_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments USING btree (status);
CREATE INDEX IF NOT EXISTS idx_product_analytics_created_at ON public.product_analytics USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event_type ON public.product_analytics USING btree (event_type);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON public.product_analytics USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_seller_id ON public.product_analytics USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products USING btree (seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_seller_apps_user_id ON public.seller_applications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);

-- ─────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_access_order(_order_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    is_buyer BOOLEAN;
    is_seller BOOLEAN;
    is_admin BOOLEAN;
BEGIN
    -- Check if user is buyer
    SELECT EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = _order_id AND buyer_id = _user_id
    ) INTO is_buyer;

    -- Check if user is seller of any item in this order
    SELECT EXISTS (
        SELECT 1 FROM public.order_items
        WHERE order_id = _order_id AND seller_id = _user_id
    ) INTO is_seller;

    -- Check if user is admin
    -- Note: has_role is already stable, but we query user_roles directly for speed
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'admin'
    ) INTO is_admin;

    RETURN is_buyer OR is_seller OR is_admin;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id uuid, p_quantity integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_updated INTEGER;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN false;
    END IF;

    UPDATE public.products
       SET stock_quantity = stock_quantity - p_quantity
     WHERE id = p_product_id
       AND stock_quantity IS NOT NULL
       AND stock_quantity >= p_quantity;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
 BEGIN
   EXECUTE query;
 END;
 $function$;

CREATE OR REPLACE FUNCTION public.generate_product_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only generate if name changed or new insert
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.name <> OLD.name) THEN
        -- Format: TAD-{DisplayID}-{SlugifiedName}
        -- Note: For INSERT, display_id might be generated by default value, but NEW.display_id should have it if we used DEFAULT
        -- However, BEFORE INSERT triggers see the NEW values *before* defaults are applied if not provided?
        -- Actually, defaults are applied *before* BEFORE triggers for normal columns.

        NEW.slug := 'TAD-' || NEW.display_id || '-' || public.slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_coupons_columns()
 RETURNS TABLE(col text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN QUERY SELECT column_name::text FROM information_schema.columns
        WHERE table_name = 'coupons' AND table_schema = 'public';
    END;
    $function$;

CREATE OR REPLACE FUNCTION public.get_my_profile_v2()
 RETURNS SETOF profiles
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_my_roles()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(ur)
    INTO result
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid();

    RETURN COALESCE(result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_explicit(target_id uuid)
 RETURNS SETOF profiles
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.profiles WHERE id = target_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_table_columns(t_name text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        cols json;
    BEGIN
        SELECT json_agg(column_name) INTO cols
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t_name;
        RETURN cols;
    END;
    $function$;

CREATE OR REPLACE FUNCTION public.get_table_info()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
        RETURN (SELECT json_agg(row_to_json(c)) FROM (
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_name = 'coupons' AND table_schema = 'public'
        ) c);
    END;
    $function$;

CREATE OR REPLACE FUNCTION public.get_user_debug_info(p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    DECLARE
        v_user_id uuid;
        v_profile json;
        v_application json;
        v_roles json;
    BEGIN
        -- Get profile info
        SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email;

        IF v_user_id IS NULL THEN
            RETURN json_build_object('error', 'Usuário não encontrado');
        END IF;

        SELECT row_to_json(p) INTO v_profile FROM public.profiles p WHERE id = v_user_id;
        SELECT row_to_json(a) INTO v_application FROM public.seller_applications a WHERE user_id = v_user_id;
        SELECT json_agg(role) INTO v_roles FROM public.user_roles WHERE user_id = v_user_id;

        RETURN json_build_object(
            'user_id', v_user_id,
            'profile', v_profile,
            'application', v_application,
            'roles', v_roles
        );
    END;
    $function$;

CREATE OR REPLACE FUNCTION public.get_user_roles_explicit(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(ur)
    INTO result
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id;

    RETURN COALESCE(result, '[]'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_default_address()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.is_default THEN
        UPDATE public.user_addresses
        SET is_default = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_seller_approval_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_plan_id UUID;
    v_plan_price DECIMAL(10,2);
    v_subscription_id UUID;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN

        -- Update Profile
        UPDATE public.profiles
        SET role = 'seller', is_approved = true
        WHERE id = NEW.user_id;

        -- Ensure user_roles entry
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'seller')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Subscription handling...
        IF NEW.chosen_plan_id IS NOT NULL THEN
             v_plan_id := NEW.chosen_plan_id;
        ELSE
             SELECT id INTO v_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY price ASC LIMIT 1;
        END IF;

        IF v_plan_id IS NOT NULL THEN
            INSERT INTO public.seller_subscriptions (seller_id, plan_id, status, current_period_start, current_period_end)
            VALUES (NEW.user_id, v_plan_id, 'active', now(), now() + INTERVAL '30 days')
            ON CONFLICT (seller_id) DO UPDATE SET status = 'active';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE public.coupons
       SET used_count = COALESCE(used_count, 0) + 1,
           updated_at = now()
     WHERE upper(code) = upper(p_code)
       AND is_active = true
       AND (usage_limit IS NULL OR usage_limit = 0 OR COALESCE(used_count, 0) < usage_limit);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_order_seller_check(_order_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.order_items
    WHERE order_id = _order_id AND seller_id = _user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_cols()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT string_agg(column_name, ', ')
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coupons';
    $function$;

CREATE OR REPLACE FUNCTION public.restore_product_stock(p_product_id uuid, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RETURN;
    END IF;

    UPDATE public.products
       SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity
     WHERE id = p_product_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.slugify(value text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  -- Lowercase
  value := lower(value);
  -- Remove accents
  value := translate(value, 'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭįòóôõöøōŏőùúûüũūŭůűųñç', 'aaaaaaaaaaaaaaaaeeeeeeeeeeeeiiiiiiiiiiiiioooooooooooooooooouuuuuuuuuuuuuuunc');
  -- Remove non-alphanumeric chars (keep hyphens)
  value := regexp_replace(value, '[^a-z0-9\-]', '-', 'g');
  -- Remove multiple hyphens
  value := regexp_replace(value, '-+', '-', 'g');
  -- Remove leading/trailing hyphens
  value := trim(both '-' from value);

  RETURN value;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────
-- Views
-- ─────────────────────────────────────────────────────────────
create or replace view public."product_stats_daily" as
SELECT product_id,
    seller_id,
    (date_trunc('day'::text, created_at))::date AS date,
    count(*) FILTER (WHERE (event_type = 'view'::text)) AS total_views,
    count(*) FILTER (WHERE (event_type = ANY (ARRAY['click_buy'::text, 'whatsapp_click'::text, 'appointment_start'::text]))) AS total_conversions,
    count(DISTINCT session_id) FILTER (WHERE (event_type = 'view'::text)) AS unique_views
   FROM product_analytics
  GROUP BY product_id, seller_id, ((date_trunc('day'::text, created_at))::date);
;

create or replace view public."seller_summary" as
WITH seller_categories AS (
         SELECT p_1.seller_id,
            c.name AS category_name,
            row_number() OVER (PARTITION BY p_1.seller_id ORDER BY (count(*)) DESC) AS rank
           FROM (products p_1
             JOIN categories c ON ((c.id = p_1.category_id)))
          GROUP BY p_1.seller_id, c.name
        )
 SELECT p.id,
    p.full_name AS name,
    p.bio AS description,
    p.avatar_url AS avatar,
    p.store_banner_url AS banner,
    ((COALESCE(p.city, ''::text) ||
        CASE
            WHEN ((p.city IS NOT NULL) AND (p.state IS NOT NULL)) THEN ', '::text
            ELSE ''::text
        END) || COALESCE(p.state, ''::text)) AS location,
    (COALESCE(avg(r.rating), (0)::numeric))::numeric(3,1) AS rating,
    count(DISTINCT r.id) AS review_count,
    count(DISTINCT pr.id) AS product_count,
    sc.category_name AS main_category,
    (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ((ur.user_id = p.id) AND (ur.role = 'seller'::app_role)))) AS is_seller,
    p.created_at AS joined_at
   FROM (((profiles p
     LEFT JOIN products pr ON ((pr.seller_id = p.id)))
     LEFT JOIN reviews r ON ((r.product_id = pr.id)))
     LEFT JOIN seller_categories sc ON (((sc.seller_id = p.id) AND (sc.rank = 1))))
  GROUP BY p.id, sc.category_name, p.store_banner_url
 HAVING (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ((ur.user_id = p.id) AND (ur.role = 'seller'::app_role))));
;

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────
drop trigger if exists "update_coupons_updated_at" on public."coupons";
create trigger "update_coupons_updated_at" BEFORE UPDATE on public."coupons" for each row EXECUTE FUNCTION handle_updated_at();
drop trigger if exists "update_gift_lists_updated_at" on public."gift_lists";
create trigger "update_gift_lists_updated_at" BEFORE UPDATE on public."gift_lists" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "update_orders_updated_at" on public."orders";
create trigger "update_orders_updated_at" BEFORE UPDATE on public."orders" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "update_payments_updated_at" on public."payments";
create trigger "update_payments_updated_at" BEFORE UPDATE on public."payments" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "update_product_variations_updated_at" on public."product_variations";
create trigger "update_product_variations_updated_at" BEFORE UPDATE on public."product_variations" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "set_product_slug" on public."products";
create trigger "set_product_slug" BEFORE INSERT or UPDATE on public."products" for each row EXECUTE FUNCTION generate_product_slug();
drop trigger if exists "update_products_updated_at" on public."products";
create trigger "update_products_updated_at" BEFORE UPDATE on public."products" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "update_profiles_updated_at" on public."profiles";
create trigger "update_profiles_updated_at" BEFORE UPDATE on public."profiles" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "trg_seller_approval_subscription" on public."seller_applications";
create trigger "trg_seller_approval_subscription" AFTER UPDATE on public."seller_applications" for each row EXECUTE FUNCTION handle_seller_approval_subscription();
drop trigger if exists "update_seller_invoices_updated_at" on public."seller_invoices";
create trigger "update_seller_invoices_updated_at" BEFORE UPDATE on public."seller_invoices" for each row EXECUTE FUNCTION update_updated_at_column();
drop trigger if exists "on_default_address_change" on public."user_addresses";
create trigger "on_default_address_change" BEFORE INSERT or UPDATE on public."user_addresses" for each row EXECUTE FUNCTION handle_default_address();
drop trigger if exists "update_user_addresses_updated_at" on public."user_addresses";
create trigger "update_user_addresses_updated_at" BEFORE UPDATE on public."user_addresses" for each row EXECUTE FUNCTION update_updated_at_column();

-- Trigger de criação de perfil no signup (schema auth).
drop trigger if exists "on_auth_user_created" on auth."users";
create trigger "on_auth_user_created" AFTER INSERT on auth."users" for each row EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public."appointments" enable row level security;
alter table public."campaign_participants" enable row level security;
alter table public."campaigns" enable row level security;
alter table public."cart" enable row level security;
alter table public."categories" enable row level security;
alter table public."coupons" enable row level security;
alter table public."delivery_slots" enable row level security;
alter table public."gift_list_items" enable row level security;
alter table public."gift_lists" enable row level security;
alter table public."gift_wraps" enable row level security;
alter table public."important_dates" enable row level security;
alter table public."order_items" enable row level security;
alter table public."orders" enable row level security;
alter table public."payment_events" enable row level security;
alter table public."payments" enable row level security;
alter table public."product_analytics" enable row level security;
alter table public."product_variations" enable row level security;
alter table public."products" enable row level security;
alter table public."profiles" enable row level security;
alter table public."reviews" enable row level security;
alter table public."seller_applications" enable row level security;
alter table public."seller_invoices" enable row level security;
alter table public."seller_subscriptions" enable row level security;
alter table public."service_availability" enable row level security;
alter table public."site_settings" enable row level security;
alter table public."subscription_plans" enable row level security;
alter table public."user_addresses" enable row level security;
alter table public."user_roles" enable row level security;
alter table public."wishlist" enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Policies (public)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "Sellers can manage participation" on public."campaign_participants";
create policy "Sellers can manage participation" on public."campaign_participants" for ALL to public using ((auth.uid() = seller_id));
drop policy if exists "Campaigns are viewable by all" on public."campaigns";
create policy "Campaigns are viewable by all" on public."campaigns" for SELECT to public using (true);
drop policy if exists "Own Cart" on public."cart";
create policy "Own Cart" on public."cart" for ALL to public using ((auth.uid() = user_id));
drop policy if exists "Admin Manage Categories" on public."categories";
create policy "Admin Manage Categories" on public."categories" for ALL to public using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Allow All Access" on public."categories";
create policy "Allow All Access" on public."categories" for ALL to public using (true) with check (true);
drop policy if exists "Public Read" on public."categories";
create policy "Public Read" on public."categories" for SELECT to public using (true);
drop policy if exists "Admin Manage Coupons" on public."coupons";
create policy "Admin Manage Coupons" on public."coupons" for ALL to public using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Coupons are viewable by everyone" on public."coupons";
create policy "Coupons are viewable by everyone" on public."coupons" for SELECT to public using ((is_active = true));
drop policy if exists "Sellers manage own coupons" on public."coupons";
create policy "Sellers manage own coupons" on public."coupons" for ALL to public using ((auth.uid() = seller_id));
drop policy if exists "Admin Manage Slots" on public."delivery_slots";
create policy "Admin Manage Slots" on public."delivery_slots" for ALL to public using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Public Read" on public."delivery_slots";
create policy "Public Read" on public."delivery_slots" for SELECT to public using (true);
drop policy if exists "Owners manage gift list items" on public."gift_list_items";
create policy "Owners manage gift list items" on public."gift_list_items" for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM gift_lists gl
  WHERE ((gl.id = gift_list_items.list_id) AND (gl.user_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM gift_lists gl
  WHERE ((gl.id = gift_list_items.list_id) AND (gl.user_id = auth.uid())))));
drop policy if exists "View items of visible lists" on public."gift_list_items";
create policy "View items of visible lists" on public."gift_list_items" for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM gift_lists gl
  WHERE ((gl.id = gift_list_items.list_id) AND ((gl.user_id = auth.uid()) OR (gl.is_public = true))))));
drop policy if exists "Owners manage gift lists" on public."gift_lists";
create policy "Owners manage gift lists" on public."gift_lists" for ALL to authenticated using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
drop policy if exists "Owners view gift lists" on public."gift_lists";
create policy "Owners view gift lists" on public."gift_lists" for SELECT to authenticated using (((user_id = auth.uid()) OR (is_public = true)));
drop policy if exists "Enable all for admins" on public."gift_wraps";
create policy "Enable all for admins" on public."gift_wraps" for ALL to authenticated using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Enable read for all active gift wraps" on public."gift_wraps";
create policy "Enable read for all active gift wraps" on public."gift_wraps" for SELECT to public using ((is_active = true));
drop policy if exists "Sellers manage own gift wraps" on public."gift_wraps";
create policy "Sellers manage own gift wraps" on public."gift_wraps" for ALL to authenticated using (((seller_id = auth.uid()) OR (( SELECT user_roles.role
   FROM user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1) = 'admin'::app_role))) with check (((seller_id = auth.uid()) OR (( SELECT user_roles.role
   FROM user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1) = 'admin'::app_role)));
drop policy if exists "Owners manage important dates" on public."important_dates";
create policy "Owners manage important dates" on public."important_dates" for ALL to authenticated using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
drop policy if exists "Guest and Buyer Insert Order Items" on public."order_items";
create policy "Guest and Buyer Insert Order Items" on public."order_items" for INSERT to public with check ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND ((orders.buyer_id = auth.uid()) OR (orders.buyer_id IS NULL))))));
drop policy if exists "Universal order items access" on public."order_items";
create policy "Universal order items access" on public."order_items" for SELECT to authenticated using (((seller_id = auth.uid()) OR can_access_order(order_id, auth.uid())));
drop policy if exists "View Own Order Items" on public."order_items";
create policy "View Own Order Items" on public."order_items" for SELECT to public using ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND ((orders.buyer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
drop policy if exists "Buyer Update Own Orders" on public."orders";
create policy "Buyer Update Own Orders" on public."orders" for UPDATE to public using (((auth.uid() = buyer_id) OR has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Buyer View Own Orders" on public."orders";
create policy "Buyer View Own Orders" on public."orders" for SELECT to public using (((auth.uid() = buyer_id) OR has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Guest and Buyer Create Orders" on public."orders";
create policy "Guest and Buyer Create Orders" on public."orders" for INSERT to public with check (((auth.uid() = buyer_id) OR (buyer_id IS NULL)));
drop policy if exists "Sellers can update orders containing their products" on public."orders";
create policy "Sellers can update orders containing their products" on public."orders" for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM order_items oi
  WHERE ((oi.order_id = orders.id) AND (oi.seller_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM order_items oi
  WHERE ((oi.order_id = orders.id) AND (oi.seller_id = auth.uid())))));
drop policy if exists "Universal order access" on public."orders";
create policy "Universal order access" on public."orders" for SELECT to authenticated using (can_access_order(id, auth.uid()));
drop policy if exists "Admins can manage payment events" on public."payment_events";
create policy "Admins can manage payment events" on public."payment_events" for ALL to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Admins can view payment events" on public."payment_events";
create policy "Admins can view payment events" on public."payment_events" for SELECT to authenticated using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Buyers can insert payment events from own orders" on public."payment_events";
create policy "Buyers can insert payment events from own orders" on public."payment_events" for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payment_events.order_id) AND (o.buyer_id = auth.uid())))));
drop policy if exists "Admins can manage payments" on public."payments";
create policy "Admins can manage payments" on public."payments" for ALL to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Buyers can insert payments from own orders" on public."payments";
create policy "Buyers can insert payments from own orders" on public."payments" for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payments.order_id) AND (o.buyer_id = auth.uid())))));
drop policy if exists "Buyers can view payments from own orders" on public."payments";
create policy "Buyers can view payments from own orders" on public."payments" for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payments.order_id) AND (o.buyer_id = auth.uid())))));
drop policy if exists "Sellers can view payments from own sales" on public."payments";
create policy "Sellers can view payments from own sales" on public."payments" for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payments.order_id) AND (o.seller_id = auth.uid())))));
drop policy if exists "View Own Payments" on public."payments";
create policy "View Own Payments" on public."payments" for SELECT to public using ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = payments.order_id) AND ((orders.buyer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
drop policy if exists "Anyone can insert events" on public."product_analytics";
create policy "Anyone can insert events" on public."product_analytics" for INSERT to public with check (true);
drop policy if exists "Public can view anonymized analytics" on public."product_analytics";
create policy "Public can view anonymized analytics" on public."product_analytics" for SELECT to public using (true);
drop policy if exists "Sellers can view own analytics" on public."product_analytics";
create policy "Sellers can view own analytics" on public."product_analytics" for SELECT to authenticated using (((auth.uid() = seller_id) OR (EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))));
drop policy if exists "Sellers can manage own product variations" on public."product_variations";
create policy "Sellers can manage own product variations" on public."product_variations" for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM products
  WHERE ((products.id = product_variations.product_id) AND (products.seller_id = auth.uid()))))) with check ((EXISTS ( SELECT 1
   FROM products
  WHERE ((products.id = product_variations.product_id) AND (products.seller_id = auth.uid())))));
drop policy if exists "Variations are viewable by everyone" on public."product_variations";
create policy "Variations are viewable by everyone" on public."product_variations" for SELECT to public using (true);
drop policy if exists "Admin Manage Products" on public."products";
create policy "Admin Manage Products" on public."products" for ALL to public using ((has_role(auth.uid(), 'admin'::app_role) OR (seller_id = auth.uid())));
drop policy if exists "Admins can manage all products" on public."products";
create policy "Admins can manage all products" on public."products" for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
drop policy if exists "Approved sellers can create products" on public."products";
create policy "Approved sellers can create products" on public."products" for INSERT to authenticated with check (((auth.uid() = seller_id) AND (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'seller'::app_role) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_approved = true))))))));
drop policy if exists "Approved sellers can update own products" on public."products";
create policy "Approved sellers can update own products" on public."products" for UPDATE to authenticated using ((has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = seller_id) AND has_role(auth.uid(), 'seller'::app_role) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_approved = true)))))));
drop policy if exists "Public Read" on public."products";
create policy "Public Read" on public."products" for SELECT to public using (true);
drop policy if exists "Public can view active products" on public."products";
create policy "Public can view active products" on public."products" for SELECT to public using ((is_active = true));
drop policy if exists "Sellers can delete own products" on public."products";
create policy "Sellers can delete own products" on public."products" for DELETE to authenticated using ((auth.uid() = seller_id));
drop policy if exists "Sellers can view own products" on public."products";
create policy "Sellers can view own products" on public."products" for SELECT to authenticated using ((auth.uid() = seller_id));
drop policy if exists "Admins can update any profile" on public."profiles";
create policy "Admins can update any profile" on public."profiles" for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))) with check ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
drop policy if exists "Admins can view all profiles" on public."profiles";
create policy "Admins can view all profiles" on public."profiles" for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
drop policy if exists "Enable insert for users based on id" on public."profiles";
create policy "Enable insert for users based on id" on public."profiles" for INSERT to authenticated with check ((auth.uid() = id));
drop policy if exists "Enable read access for authenticated users" on public."profiles";
create policy "Enable read access for authenticated users" on public."profiles" for SELECT to authenticated using (true);
drop policy if exists "Enable update for users based on id" on public."profiles";
create policy "Enable update for users based on id" on public."profiles" for UPDATE to authenticated using ((auth.uid() = id)) with check ((auth.uid() = id));
drop policy if exists "Public Read" on public."profiles";
create policy "Public Read" on public."profiles" for SELECT to public using (true);
drop policy if exists "Public profiles are viewable by everyone" on public."profiles";
create policy "Public profiles are viewable by everyone" on public."profiles" for SELECT to public using (true);
drop policy if exists "Self Read/Update Profile" on public."profiles";
create policy "Self Read/Update Profile" on public."profiles" for UPDATE to public using ((auth.uid() = id));
drop policy if exists "Users can update own profile" on public."profiles";
create policy "Users can update own profile" on public."profiles" for UPDATE to authenticated using ((auth.uid() = id));
drop policy if exists "Users can view own profile" on public."profiles";
create policy "Users can view own profile" on public."profiles" for SELECT to authenticated using ((auth.uid() = id));
drop policy if exists "Public Read" on public."reviews";
create policy "Public Read" on public."reviews" for SELECT to public using (true);
drop policy if exists "Admins can update applications" on public."seller_applications";
create policy "Admins can update applications" on public."seller_applications" for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
drop policy if exists "Admins can view all applications" on public."seller_applications";
create policy "Admins can view all applications" on public."seller_applications" for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
drop policy if exists "Users can create their own seller application" on public."seller_applications";
create policy "Users can create their own seller application" on public."seller_applications" for INSERT to authenticated with check ((auth.uid() = user_id));
drop policy if exists "Users can view own applications" on public."seller_applications";
create policy "Users can view own applications" on public."seller_applications" for SELECT to authenticated using ((auth.uid() = user_id));
drop policy if exists "Users can view their own seller application" on public."seller_applications";
create policy "Users can view their own seller application" on public."seller_applications" for SELECT to authenticated using ((auth.uid() = user_id));
drop policy if exists "Admins can view all invoices" on public."seller_invoices";
create policy "Admins can view all invoices" on public."seller_invoices" for ALL to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
drop policy if exists "Sellers can view their own invoices" on public."seller_invoices";
create policy "Sellers can view their own invoices" on public."seller_invoices" for SELECT to public using ((auth.uid() = seller_id));
drop policy if exists "Users can insert their own pending invoices" on public."seller_invoices";
create policy "Users can insert their own pending invoices" on public."seller_invoices" for INSERT to public with check ((auth.uid() = seller_id));
drop policy if exists "Admins manage subscriptions" on public."seller_subscriptions";
create policy "Admins manage subscriptions" on public."seller_subscriptions" for ALL to authenticated using ((( SELECT user_roles.role
   FROM user_roles
  WHERE (user_roles.user_id = auth.uid())
 LIMIT 1) = 'admin'::app_role));
drop policy if exists "Sellers view own subscription" on public."seller_subscriptions";
create policy "Sellers view own subscription" on public."seller_subscriptions" for SELECT to authenticated using ((seller_id = auth.uid()));
drop policy if exists "Admins can update site settings" on public."site_settings";
create policy "Admins can update site settings" on public."site_settings" for ALL to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
drop policy if exists "Admins gerenciam tudo" on public."site_settings";
create policy "Admins gerenciam tudo" on public."site_settings" for ALL to authenticated using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Permitir leitura pública" on public."site_settings";
create policy "Permitir leitura pública" on public."site_settings" for SELECT to public using (true);
drop policy if exists "Public can read site settings" on public."site_settings";
create policy "Public can read site settings" on public."site_settings" for SELECT to public using (true);
drop policy if exists "Public read plans" on public."subscription_plans";
create policy "Public read plans" on public."subscription_plans" for SELECT to public using ((is_active = true));
drop policy if exists "Users can delete their own addresses" on public."user_addresses";
create policy "Users can delete their own addresses" on public."user_addresses" for DELETE to public using ((auth.uid() = user_id));
drop policy if exists "Users can insert their own addresses" on public."user_addresses";
create policy "Users can insert their own addresses" on public."user_addresses" for INSERT to public with check ((auth.uid() = user_id));
drop policy if exists "Users can manage their own addresses" on public."user_addresses";
create policy "Users can manage their own addresses" on public."user_addresses" for ALL to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
drop policy if exists "Users can update their own addresses" on public."user_addresses";
create policy "Users can update their own addresses" on public."user_addresses" for UPDATE to public using ((auth.uid() = user_id));
drop policy if exists "Users can view their own addresses" on public."user_addresses";
create policy "Users can view their own addresses" on public."user_addresses" for SELECT to public using ((auth.uid() = user_id));
drop policy if exists "Admin All Roles" on public."user_roles";
create policy "Admin All Roles" on public."user_roles" for ALL to public using (has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Admin see all" on public."user_roles";
create policy "Admin see all" on public."user_roles" for SELECT to authenticated using (is_admin());
drop policy if exists "See own roles" on public."user_roles";
create policy "See own roles" on public."user_roles" for SELECT to authenticated using ((auth.uid() = user_id));
drop policy if exists "Own Wishlist" on public."wishlist";
create policy "Own Wishlist" on public."wishlist" for ALL to public using ((auth.uid() = user_id));
drop policy if exists "Users can delete from own wishlist" on public."wishlist";
create policy "Users can delete from own wishlist" on public."wishlist" for DELETE to authenticated using ((auth.uid() = user_id));
drop policy if exists "Users can insert into own wishlist" on public."wishlist";
create policy "Users can insert into own wishlist" on public."wishlist" for INSERT to authenticated with check ((auth.uid() = user_id));
drop policy if exists "Users can view own wishlist" on public."wishlist";
create policy "Users can view own wishlist" on public."wishlist" for SELECT to authenticated using ((auth.uid() = user_id));

-- ─────────────────────────────────────────────────────────────
-- Storage
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('categories', 'categories', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('cms', 'cms', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('gift-wraps', 'gift-wraps', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('seller-docs', 'seller-docs', true) on conflict (id) do nothing;

drop policy if exists "Admins can delete gift-wrap images" on storage."undefined";
create policy "Admins can delete gift-wrap images" on storage."undefined" for DELETE to authenticated using (((bucket_id = 'gift-wraps'::text) AND has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Admins can manage CMS images" on storage."undefined";
create policy "Admins can manage CMS images" on storage."undefined" for ALL to authenticated using (((bucket_id = 'cms'::text) AND has_role(auth.uid(), 'admin'::app_role))) with check (((bucket_id = 'cms'::text) AND has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Admins can update gift-wrap images" on storage."undefined";
create policy "Admins can update gift-wrap images" on storage."undefined" for UPDATE to authenticated using (((bucket_id = 'gift-wraps'::text) AND has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Admins can upload gift-wrap images" on storage."undefined";
create policy "Admins can upload gift-wrap images" on storage."undefined" for INSERT to authenticated with check (((bucket_id = 'gift-wraps'::text) AND has_role(auth.uid(), 'admin'::app_role)));
drop policy if exists "Authenticated Upload" on storage."undefined";
create policy "Authenticated Upload" on storage."undefined" for INSERT to public with check (((bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)));
drop policy if exists "Authenticated sellers can upload docs" on storage."undefined";
create policy "Authenticated sellers can upload docs" on storage."undefined" for INSERT to authenticated with check (((bucket_id = 'seller-docs'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
drop policy if exists "Authenticated users can delete" on storage."undefined";
create policy "Authenticated users can delete" on storage."undefined" for DELETE to authenticated using ((bucket_id = 'products'::text));
drop policy if exists "Authenticated users can update" on storage."undefined";
create policy "Authenticated users can update" on storage."undefined" for UPDATE to authenticated using ((bucket_id = 'products'::text));
drop policy if exists "Authenticated users can upload" on storage."undefined";
create policy "Authenticated users can upload" on storage."undefined" for INSERT to authenticated with check ((bucket_id = 'products'::text));
drop policy if exists "Authenticated users can upload seller docs" on storage."undefined";
create policy "Authenticated users can upload seller docs" on storage."undefined" for INSERT to authenticated with check (((bucket_id = 'seller-docs'::text) AND (auth.uid() = owner)));
drop policy if exists "Public Access" on storage."undefined";
create policy "Public Access" on storage."undefined" for SELECT to public using ((bucket_id = ANY (ARRAY['products'::text, 'avatars'::text, 'categories'::text, 'cms'::text, 'gift-wraps'::text])));
drop policy if exists "Public Read Access" on storage."undefined";
create policy "Public Read Access" on storage."undefined" for SELECT to public using ((bucket_id = 'seller-docs'::text));
drop policy if exists "Public access to gift-wrap images" on storage."undefined";
create policy "Public access to gift-wrap images" on storage."undefined" for SELECT to public using ((bucket_id = 'gift-wraps'::text));
drop policy if exists "Sellers can manage product images" on storage."undefined";
create policy "Sellers can manage product images" on storage."undefined" for ALL to authenticated using (((bucket_id = 'products'::text) AND (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role))));
drop policy if exists "Users can delete their own seller docs" on storage."undefined";
create policy "Users can delete their own seller docs" on storage."undefined" for DELETE to authenticated using (((bucket_id = 'seller-docs'::text) AND (auth.uid() = owner)));
drop policy if exists "Users can update their own seller docs" on storage."undefined";
create policy "Users can update their own seller docs" on storage."undefined" for UPDATE to authenticated using (((bucket_id = 'seller-docs'::text) AND (auth.uid() = owner)));

-- ─────────────────────────────────────────────────────────────
-- Segurança: helpers de introspecção/SQL só para service_role
-- ─────────────────────────────────────────────────────────────
revoke execute on function public.exec_sql(text) from public;
revoke execute on function public.exec_sql(text) from anon, authenticated;
grant execute on function public.exec_sql(text) to service_role;
revoke execute on function public.get_table_columns(text) from public;
revoke execute on function public.get_table_columns(text) from anon, authenticated;
grant execute on function public.get_table_columns(text) to service_role;
revoke execute on function public.get_table_info() from public;
revoke execute on function public.get_table_info() from anon, authenticated;
grant execute on function public.get_table_info() to service_role;
revoke execute on function public.list_cols() from public;
revoke execute on function public.list_cols() from anon, authenticated;
grant execute on function public.list_cols() to service_role;
revoke execute on function public.get_coupons_columns() from public;
revoke execute on function public.get_coupons_columns() from anon, authenticated;
grant execute on function public.get_coupons_columns() to service_role;
revoke execute on function public.get_user_debug_info(text) from public;
revoke execute on function public.get_user_debug_info(text) from anon, authenticated;
grant execute on function public.get_user_debug_info(text) to service_role;

reset check_function_bodies;
