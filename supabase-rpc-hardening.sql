-- Cierra un hueco de seguridad real: register_sale/register_receipt son "security definer"
-- (se saltan RLS por completo) y Postgres otorga EXECUTE a PUBLIC en funciones nuevas salvo
-- que se revoque explícitamente. Verificado: llamando register_sale sin sesión, con solo la
-- anon key, la función llegó hasta el INSERT en sales. Cualquiera con la anon key (pública
-- por diseño) podía insertar ventas falsas y descontar stock sin autenticarse.
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

revoke execute on function public.register_sale(jsonb) from public, anon;
revoke execute on function public.register_receipt(jsonb) from public, anon;
grant execute on function public.register_sale(jsonb) to authenticated;
grant execute on function public.register_receipt(jsonb) to authenticated;

create or replace function public.register_sale(payload jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  new_sale_id uuid;
  item jsonb;
begin
  if not public.has_permission('pos') then
    raise exception 'No autorizado';
  end if;

  insert into public.sales (customer_id, user_id, payment_method, total, cash_received, change)
  values (
    (payload->>'customer_id')::uuid,
    auth.uid(),
    payload->>'payment_method',
    (payload->>'total')::numeric,
    (payload->>'cash_received')::numeric,
    (payload->>'change')::numeric
  )
  returning id into new_sale_id;

  for item in select * from jsonb_array_elements(payload->'items')
  loop
    insert into public.sale_items (sale_id, product_id, product_name, qty, unit_price)
    values (new_sale_id, (item->>'product_id')::uuid, item->>'name', (item->>'qty')::int, (item->>'price')::numeric);

    update public.products set stock = stock - (item->>'qty')::int
    where id = (item->>'product_id')::uuid;

    insert into public.stock_movements (product_id, type, quantity, reference_id, user_id)
    values ((item->>'product_id')::uuid, 'venta', -(item->>'qty')::int, new_sale_id, auth.uid());
  end loop;

  return new_sale_id;
end;
$$;

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

    update public.products set stock = stock + (item->>'qty')::int
    where id = (item->>'product_id')::uuid;

    insert into public.stock_movements (product_id, type, quantity, reference_id, user_id)
    values ((item->>'product_id')::uuid, 'ingreso', (item->>'qty')::int, new_receipt_id, auth.uid());
  end loop;

  return new_receipt_id;
end;
$$;

-- Nueva RPC para los ajustes manuales de Inventario (entrada/salida). Cierra otro hueco
-- anotado en la Fase 1: sin esto, ajustar stock tocaría products bajo la política
-- productos_write (exige permiso 'productos'), no 'inventario'.
create or replace function public.adjust_stock(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  v_product_id uuid := (payload->>'product_id')::uuid;
  v_delta int := (payload->>'delta')::int;
  v_type text := payload->>'type';
begin
  if not public.has_permission('inventario') then
    raise exception 'No autorizado';
  end if;

  update public.products set stock = greatest(0, stock + v_delta)
  where id = v_product_id;

  insert into public.stock_movements (product_id, type, quantity, user_id)
  values (v_product_id, v_type, v_delta, auth.uid());
end;
$$;

revoke execute on function public.adjust_stock(jsonb) from public, anon;
grant execute on function public.adjust_stock(jsonb) to authenticated;
