-- Fase A (mejoras MVP): registra el stock inicial de un producto nuevo como un movimiento
-- de tipo 'inicial' en stock_movements, igual que ya ocurre con ventas, ingresos y ajustes.
-- Hoy productos/index.jsx inserta el producto directo con supabase.from('products').insert(...)
-- y el stock de arranque no queda registrado en ningún lado.
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

-- 1) Amplía el check constraint de stock_movements.type para aceptar 'inicial'.
alter table public.stock_movements drop constraint stock_movements_type_check;
alter table public.stock_movements add constraint stock_movements_type_check
  check (type in ('venta', 'ingreso', 'entrada', 'salida', 'ajuste', 'inicial'));

-- 2) RPC que crea el producto y, si el stock de arranque es mayor a 0, registra el movimiento.
--    Mismo patrón que register_sale/register_receipt/adjust_stock: security definer +
--    chequeo interno de permiso + revoke/grant explícito (Postgres otorga EXECUTE a PUBLIC
--    por defecto en funciones nuevas).
create or replace function public.register_product(payload jsonb)
returns public.products
language plpgsql
security definer
as $$
declare
  new_row public.products;
begin
  if not public.has_permission('productos') then
    raise exception 'No autorizado';
  end if;

  insert into public.products (
    name, barcode, category, unit, weight, weight_unit,
    description, cost_price, sale_price, stock, min_stock, image_url
  )
  values (
    payload->>'name',
    nullif(payload->>'barcode', ''),
    payload->>'category',
    coalesce(payload->>'unit', 'unidad'),
    nullif(payload->>'weight', '')::numeric,
    coalesce(payload->>'weight_unit', 'g'),
    payload->>'description',
    coalesce((payload->>'cost_price')::numeric, 0),
    coalesce((payload->>'sale_price')::numeric, 0),
    coalesce((payload->>'stock')::int, 0),
    coalesce((payload->>'min_stock')::int, 0),
    payload->>'image_url'
  )
  returning * into new_row;

  if new_row.stock > 0 then
    insert into public.stock_movements (product_id, type, quantity, user_id)
    values (new_row.id, 'inicial', new_row.stock, auth.uid());
  end if;

  return new_row;
end;
$$;

revoke execute on function public.register_product(jsonb) from public, anon;
grant execute on function public.register_product(jsonb) to authenticated;
