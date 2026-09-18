-- Actualiza register_receipt (ya endurecida en supabase-rpc-hardening.sql) para que, además
-- de sumar stock, actualice products.cost_price con el costo capturado en cada línea del
-- ingreso — así el margen mostrado en Productos siempre refleja el último costo pagado.
-- No hace falta repetir los GRANT/REVOKE: la firma de la función no cambia.

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

  insert into public.receipts (doc_type, doc_number, supplier, doc_date, user_id, total_units, total_cost)
  values (
    payload->>'doc_type',
    payload->>'doc_number',
    coalesce(payload->>'supplier', 'Sin especificar'),
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
