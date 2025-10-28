-- Supabase/Postgres migration for equipment table
-- Run this in Supabase SQL editor or via psql

create extension if not exists "pgcrypto";

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  equipmenttypeid text,
  name text not null,
  category text,
  quantity_good int default 0,
  quantity_fair int default 0,
  quantity_poor int default 0,
  quantity_broken int default 0,
  totalquantity int default 0,
  base_location text,
  quantity_storage int default 0,
  quantity_lockers int default 0,
  quantity_checkout int default 0,
  notes text,
  created_at timestamptz default now()
);
