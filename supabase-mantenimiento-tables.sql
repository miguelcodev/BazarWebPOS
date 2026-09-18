-- Fase C (mejoras MVP): migra Mantenimiento de localStorage a Supabase.
-- Crea 3 tablas: datos del negocio (fila única), categorías de producto y series de
-- numeración para boletas/facturas (solo estructura, se usará cuando se implemente la
-- facturación electrónica — no emite ni numera documentos todavía).
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

-- 1) Datos del negocio: una sola fila (id fijo = 1).
create table public.business_settings (
  id                integer primary key default 1 check (id = 1),
  business_name     text not null default 'Bazar Central',
  document          text default '',
  phone             text default '',
  address           text default '',
  currency          text not null default 'PEN' check (currency in ('PEN', 'USD')),
  low_stock_alerts  boolean not null default true,
  receipt_message   text default 'Gracias por su compra',
  tax_enabled       boolean not null default false,
  updated_at        timestamptz not null default now()
);

insert into public.business_settings (id) values (1);

alter table public.business_settings enable row level security;

create policy "business_settings_select" on public.business_settings for select
  using (auth.uid() is not null);
create policy "business_settings_write" on public.business_settings for all
  using (has_permission('mantenimiento'))
  with check (has_permission('mantenimiento'));

-- 2) Categorías de producto (reemplaza el arreglo hardcodeado en productos/index.jsx).
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

insert into public.categories (name) values
  ('Abarrotes'),
  ('Bebidas y licores'),
  ('Snacks y golosinas'),
  ('Limpieza y hogar'),
  ('Cuidado personal'),
  ('Útiles escolares y oficina'),
  ('Ferretería'),
  ('Juguetería y regalos'),
  ('Mascotas'),
  ('Bazar general');

alter table public.categories enable row level security;

create policy "categories_select" on public.categories for select
  using (auth.uid() is not null);
create policy "categories_write" on public.categories for all
  using (has_permission('mantenimiento'))
  with check (has_permission('mantenimiento'));

-- 3) Series de numeración para boletas/facturas propias (emitidas a clientes). No confundir
--    con receipts.doc_number, que es el número del documento QUE EMITE EL PROVEEDOR al
--    entregarnos mercadería — esto es para cuando el propio negocio facture electrónicamente.
create table public.document_series (
  id           uuid primary key default gen_random_uuid(),
  doc_type     text not null check (doc_type in ('boleta', 'factura')),
  series       text not null,
  next_number  int not null default 1,
  created_at   timestamptz not null default now(),
  unique (doc_type, series)
);

alter table public.document_series enable row level security;

create policy "document_series_select" on public.document_series for select
  using (auth.uid() is not null);
create policy "document_series_write" on public.document_series for all
  using (has_permission('mantenimiento'))
  with check (has_permission('mantenimiento'));
