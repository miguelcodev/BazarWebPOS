-- El Panel (dashboard) también necesita leer sales/sale_items para sus tarjetas y gráfico,
-- pero ventas_select/venta_items_select solo aceptaban permiso 'pos' o 'reportes'. Un perfil
-- como "Almacenero" (dashboard,productos,ingresos,inventario) vería el módulo Panel en el
-- sidebar pero con las ventas siempre en cero por RLS, sin ningún error visible.

drop policy if exists "ventas_select" on public.sales;
create policy "ventas_select" on public.sales for select
  using (has_permission('pos') or has_permission('reportes') or has_permission('dashboard'));

drop policy if exists "venta_items_select" on public.sale_items;
create policy "venta_items_select" on public.sale_items for select
  using (has_permission('pos') or has_permission('reportes') or has_permission('dashboard'));
