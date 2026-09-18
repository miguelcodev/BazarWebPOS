-- Sección 7 de supabase-schema.md: transacciones atómicas para venta e ingreso.
-- Pega y ejecuta este archivo completo en el SQL Editor de Supabase.

-- register_sale: tal como está en supabase-schema.md (sección 7).
create or replace function public.register_sale(payload jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  new_sale_id uuid;
  item jsonb;
begin
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

-- register_receipt: mismo patrón que register_sale (el doc lo menciona pero no lo escribe
-- explícitamente) — suma stock en vez de restarlo y usa los campos propios de receipts/receipt_items.
create or replace function public.register_receipt(payload jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  new_receipt_id uuid;
  item jsonb;
begin
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
