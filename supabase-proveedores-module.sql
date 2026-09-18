-- Fase B (mejoras MVP): módulo de Proveedores enlazado a Ingresos.
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

-- 1) Tabla de proveedores.
create table public.proveedores (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  ruc          text default '',
  phone        text default '',
  email        text default '',
  address      text default '',
  contact_name text default '',
  status       text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
  created_at   timestamptz not null default now()
);

alter table public.proveedores enable row level security;

-- Lectura abierta a cualquier autenticado (Ingresos necesita listar proveedores al vender...
-- perdón, al registrar un ingreso), igual que products/productos_select.
create policy "proveedores_select" on public.proveedores for select
  using (auth.uid() is not null);

-- Alta/edición/baja solo con el permiso 'proveedores'.
create policy "proveedores_write" on public.proveedores for all
  using (has_permission('proveedores'))
  with check (has_permission('proveedores'));

-- 2) Vínculo desde receipts. Se conserva la columna "supplier" (texto) como nombre
--    denormalizado al momento del ingreso, igual que sale_items.product_name /
--    receipt_items.product_name — si el proveedor cambia de nombre después, el histórico
--    de ese ingreso no se altera.
alter table public.receipts add column supplier_id uuid references public.proveedores(id);

-- 3) register_receipt ahora también guarda supplier_id.
create or replace function public.register_receipt(payload jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  new_receipt_id uuid;
  item jsonb;
begin
  if not public.has_permission('ingresos') then
    raise exception 'No autorizado';
  end if;

  insert into public.receipts (doc_type, doc_number, supplier, supplier_id, doc_date, user_id, total_units, total_cost)
  values (
    payload->>'doc_type',
    payload->>'doc_number',
    coalesce(payload->>'supplier', 'Sin especificar'),
    nullif(payload->>'supplier_id', '')::uuid,
    coalesce((payload->>'doc_date')::date, current_date),
    auth.uid(),
    (payload->>'total_units')::int,
    (payload->>'total_cost')::numeric
  )
  returning id into new_receipt_id;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.receipt_items (receipt_id, product_id, product_name, qty, cost_price)
    values (new_receipt_id, (item->>'product_id')::uuid, item->>'name', (item->>'qty')::int, (item->>'cost_price')::numeric);

    update public.products
    set stock = stock + (item->>'qty')::int,
        cost_price = (item->>'cost_price')::numeric
    where id = (item->>'product_id')::uuid;

    insert into public.stock_movements (product_id, type, quantity, reference_id, user_id)
    values ((item->>'product_id')::uuid, 'ingreso', (item->>'qty')::int, new_receipt_id, auth.uid());
  end loop;

  return new_receipt_id;
end;
$$;

revoke execute on function public.register_receipt(jsonb) from public, anon;
grant execute on function public.register_receipt(jsonb) to authenticated;

-- 4) Habilita el nuevo módulo para el perfil Administrador. Ajusta/agrega otros perfiles
--    (ej. Almacenero) según quién deba ver "Proveedores" en el sidebar.
update public.profiles
set permissions = array_append(permissions, 'proveedores')
where name = 'Administrador'
  and not ('proveedores' = any(permissions));
