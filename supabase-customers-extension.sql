-- Amplía customers con los campos que ya usa el módulo Clientes del frontend
-- (dirección, saldo pendiente / fiado, estado) pero que no estaban en el esquema original.
-- Pega y ejecuta en el SQL Editor de Supabase.

alter table public.customers
  add column if not exists address text not null default '',
  add column if not exists credit  numeric(10,2) not null default 0,
  add column if not exists status  text not null default 'Activo' check (status in ('Activo','Inactivo'));
