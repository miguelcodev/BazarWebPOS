-- Boletas/facturas con numeración real desde el POS.
-- Activa la tabla document_series (creada en supabase-mantenimiento-tables.sql, hasta ahora
-- solo administrada a mano en Mantenimiento > Numeración) para asignar un correlativo real
-- a cada venta.
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

-- 1) Columnas nuevas en sales. Nullable: las ventas ya registradas quedan sin comprobante,
--    el frontend lo maneja mostrando "Sin comprobante" en vez de fallar.
alter table public.sales add column doc_type text check (doc_type in ('boleta', 'factura'));
alter table public.sales add column doc_series text;
alter table public.sales add column doc_number int;

-- 2) Series por defecto, para que la numeración funcione sin configurar nada primero.
insert into public.document_series (doc_type, series, next_number) values
  ('boleta', 'B001', 1),
  ('factura', 'F001', 1)
on conflict (doc_type, series) do nothing;

-- 3) register_sale ahora devuelve la fila completa de sales (antes solo el uuid) y asigna
--    el correlativo dentro de la misma transacción de la venta. Cambiar el tipo de retorno
--    exige drop + create (create or replace no lo permite).
revoke execute on function public.register_sale(jsonb) from public, anon;
drop function public.register_sale(jsonb);

create function public.register_sale(payload jsonb)
returns public.sales
language plpgsql
security definer
as $$
declare
  new_sale public.sales;
  item jsonb;
  v_doc_type text := payload->>'doc_type';
  v_series_id uuid;
  v_series text;
  v_number int;
begin
  if not public.has_permission('pos') then
    raise exception 'No autorizado';
  end if;

  select id, series, next_number into v_series_id, v_series, v_number
  from public.document_series
  where doc_type = v_doc_type
  order by series asc
  limit 1
  for update;

  if v_series_id is null then
    raise exception 'No hay una serie de numeración configurada para %. Configúrala en Mantenimiento > Numeración.', v_doc_type;
  end if;

  update public.document_series set next_number = next_number + 1 where id = v_series_id;

  insert into public.sales (customer_id, user_id, payment_method, total, cash_received, change, doc_type, doc_series, doc_number)
  values (
    (payload->>'customer_id')::uuid,
    auth.uid(),
    payload->>'payment_method',
    (payload->>'total')::numeric,
    (payload->>'cash_received')::numeric,
    (payload->>'change')::numeric,
    v_doc_type,
    v_series,
    v_number
  )
  returning * into new_sale;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.sale_items (sale_id, product_id, product_name, qty, unit_price)
    values (new_sale.id, (item->>'product_id')::uuid, item->>'name', (item->>'qty')::int, (item->>'price')::numeric);

    update public.products set stock = stock - (item->>'qty')::int
    where id = (item->>'product_id')::uuid;

    insert into public.stock_movements (product_id, type, quantity, reference_id, user_id)
    values ((item->>'product_id')::uuid, 'venta', -(item->>'qty')::int, new_sale.id, auth.uid());
  end loop;

  return new_sale;
end;
$$;

revoke execute on function public.register_sale(jsonb) from public, anon;
grant execute on function public.register_sale(jsonb) to authenticated;
