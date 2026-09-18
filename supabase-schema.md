# Estructura Supabase — Bazar Central

Este documento traduce el prototipo (datos en `window.storage`) a un backend real en Supabase: tablas, relaciones, seguridad (RLS), autenticación y el plan de integración con el frontend React.

---

## 1. Mapeo prototipo → Supabase

| Dato en el prototipo (`window.storage`) | Tabla en Supabase              | Notas |
|---|---|---|
| `bazar:products`                        | `products`                     | Igual estructura, tipos ajustados |
| `bazar:customers`                       | `customers`                    | + `created_at` |
| `bazar:sales`                           | `sales` + `sale_items`         | Se separa cabecera y detalle |
| `bazar:receipts`                        | `receipts` + `receipt_items`   | Se separa cabecera y detalle |
| `bazar:profiles`                        | `profiles`                     | Igual, `permissions` como arreglo |
| `bazar:users`                           | `auth.users` + `app_users`     | Supabase Auth maneja credenciales; `app_users` guarda datos de negocio |
| `bazar:session`                         | *(eliminado)*                  | Lo maneja `supabase-js` automáticamente (JWT) |
| Ajustes manuales de Inventario          | `stock_movements`              | Nuevo: bitácora de todo movimiento de stock (auditoría) |

**Por qué separar sales/sale_items y receipts/receipt_items:** en el prototipo cada venta o ingreso guarda sus ítems como un arreglo JSON embebido. En una base relacional eso dificulta reportes (ej. "producto más vendido") y no permite `JOIN`s ni índices eficientes. Separarlos en tablas normalizadas es el cambio estructural más importante de esta migración.

---

## 2. Diagrama de relaciones

```mermaid
erDiagram
    auth_users ||--o| app_users : "1 a 1"
    profiles ||--o{ app_users : "asigna"
    app_users ||--o{ sales : "registra"
    app_users ||--o{ receipts : "registra"
    customers ||--o{ sales : "compra"
    products ||--o{ sale_items : "vendido en"
    products ||--o{ receipt_items : "recibido en"
    products ||--o{ stock_movements : "afecta"
    sales ||--o{ sale_items : "contiene"
    receipts ||--o{ receipt_items : "contiene"

    products {
        uuid id PK
        text name
        text barcode
        text category
        text unit
        numeric weight
        text weight_unit
        text description
        numeric cost_price
        numeric sale_price
        int stock
        int min_stock
        text image_url
    }
    customers {
        uuid id PK
        text name
        text email
        text phone
        text doc
    }
    sales {
        uuid id PK
        uuid customer_id FK
        uuid user_id FK
        text payment_method
        numeric total
        numeric cash_received
        numeric change
    }
    receipts {
        uuid id PK
        text doc_type
        text doc_number
        text supplier
        date doc_date
        uuid user_id FK
    }
    profiles {
        uuid id PK
        text name
        text description
        text[] permissions
    }
    app_users {
        uuid id PK_FK
        text name
        text phone
        uuid profile_id FK
        bool active
    }
```

---

## 3. Esquema SQL completo

Ejecutar en el **SQL Editor** de Supabase, en este orden (respeta dependencias entre tablas).

### 3.1 Extensiones

```sql
create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "pg_trgm";  -- búsqueda por nombre (ILIKE rápido)
```

### 3.2 Perfiles (roles del sistema)

```sql
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text default '',
  permissions  text[] not null default '{}', -- ej. {'dashboard','pos','clientes'}
  created_at   timestamptz not null default now()
);

insert into public.profiles (name, description, permissions) values
  ('Administrador', 'Acceso completo a todos los módulos del sistema.',
    '{dashboard,pos,productos,ingresos,inventario,clientes,reportes,mantenimiento}'),
  ('Vendedor', 'Atiende el punto de venta y gestiona clientes.',
    '{dashboard,pos,clientes}'),
  ('Almacenero', 'Gestiona catálogo, ingresos de mercadería e inventario.',
    '{dashboard,productos,ingresos,inventario}');
```

### 3.3 Usuarios de negocio (vinculados a `auth.users`)

Supabase Auth ya administra `email` y contraseña en `auth.users`. Esta tabla solo guarda los datos propios del negocio y el perfil asignado.

```sql
create table public.app_users (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  phone        text default '',
  profile_id   uuid references public.profiles(id),
  active       bool not null default true,
  created_at   timestamptz not null default now()
);
```

**Trigger:** cuando alguien se registra (`supabase.auth.signUp`), se crea automáticamente su fila en `app_users`, leyendo nombre/teléfono/perfil desde los metadatos enviados en el registro.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.app_users (id, name, phone, profile_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(
      (new.raw_user_meta_data->>'profile_id')::uuid,
      (select id from public.profiles where name = 'Vendedor')
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.4 Productos

```sql
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  barcode      text unique,
  category     text default '',
  unit         text not null default 'unidad', -- unidad | par | pack | caja | docena | litro | kilogramo | metro | galon
  weight       numeric,
  weight_unit  text default 'g', -- g | kg | ml | L
  description  text default '',
  cost_price   numeric(10,2) not null default 0,
  sale_price   numeric(10,2) not null default 0,
  stock        int not null default 0,
  min_stock    int not null default 0,
  image_url    text default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index products_barcode_idx on public.products (barcode);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
```

### 3.5 Clientes

```sql
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text,
  phone        text default '',
  doc          text default '',
  created_at   timestamptz not null default now()
);
```

*El "cliente genérico" ya no necesita una fila: en `sales.customer_id` simplemente se deja `null`.*

### 3.6 Ventas (POS)

```sql
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references public.customers(id),  -- null = cliente genérico
  user_id        uuid references public.app_users(id),
  payment_method text not null check (payment_method in ('efectivo','tarjeta','yape','plin')),
  total          numeric(10,2) not null,
  cash_received  numeric(10,2),
  change         numeric(10,2),
  created_at     timestamptz not null default now()
);

create table public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales(id) on delete cascade,
  product_id   uuid references public.products(id),
  product_name text not null,   -- snapshot: conserva el nombre aunque el producto cambie o se borre
  qty          int not null,
  unit_price   numeric(10,2) not null
);

create index sales_customer_idx on public.sales (customer_id);
create index sales_created_idx on public.sales (created_at desc);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_product_idx on public.sale_items (product_id);
```

### 3.7 Ingresos de mercadería (compras a proveedor)

```sql
create table public.receipts (
  id           uuid primary key default gen_random_uuid(),
  doc_type     text not null check (doc_type in ('boleta','factura','guia','otro')),
  doc_number   text not null,
  supplier     text default 'Sin especificar',
  doc_date     date not null default current_date,
  user_id      uuid references public.app_users(id),
  total_units  int not null default 0,
  total_cost   numeric(10,2) not null default 0,
  created_at   timestamptz not null default now()
);

create table public.receipt_items (
  id           uuid primary key default gen_random_uuid(),
  receipt_id   uuid not null references public.receipts(id) on delete cascade,
  product_id   uuid references public.products(id),
  product_name text not null,
  qty          int not null,
  cost_price   numeric(10,2) not null
);

create index receipts_created_idx on public.receipts (created_at desc);
create index receipt_items_receipt_idx on public.receipt_items (receipt_id);
```

### 3.8 Bitácora de movimientos de stock (auditoría)

Registra automáticamente cada venta, ingreso o ajuste manual — reemplaza el ajuste "silencioso" del prototipo por un historial completo y trazable.

```sql
create table public.stock_movements (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id),
  type         text not null check (type in ('venta','ingreso','entrada','salida','ajuste')),
  quantity     int not null,       -- positivo = entra stock, negativo = sale stock
  reference_id uuid,               -- id de sale o receipt relacionado, si aplica
  user_id      uuid references public.app_users(id),
  created_at   timestamptz not null default now()
);

create index stock_movements_product_idx on public.stock_movements (product_id);
```

---

## 4. Seguridad — Row Level Security (RLS)

Función auxiliar para saber si el usuario autenticado tiene permiso sobre un módulo:

```sql
create or replace function public.has_permission(module text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.app_users u
    join public.profiles p on p.id = u.profile_id
    where u.id = auth.uid()
      and u.active = true
      and module = any(p.permissions)
  );
$$;
```

Activar RLS y políticas por tabla:

```sql
alter table public.products        enable row level security;
alter table public.customers       enable row level security;
alter table public.sales           enable row level security;
alter table public.sale_items      enable row level security;
alter table public.receipts        enable row level security;
alter table public.receipt_items   enable row level security;
alter table public.stock_movements enable row level security;
alter table public.profiles        enable row level security;
alter table public.app_users       enable row level security;

-- Productos: lectura para cualquier autenticado; escritura con permiso "productos"
create policy "productos_select" on public.products for select
  using (auth.uid() is not null);
create policy "productos_write" on public.products for all
  using (has_permission('productos')) with check (has_permission('productos'));

-- Clientes: acceso con permiso "clientes" o "pos" (el vendedor los usa al vender)
create policy "clientes_all" on public.customers for all
  using (has_permission('clientes') or has_permission('pos'))
  with check (has_permission('clientes') or has_permission('pos'));

-- Ventas: crear/leer con permiso "pos"; nadie edita ni borra una venta ya emitida
create policy "ventas_select" on public.sales for select
  using (has_permission('pos') or has_permission('reportes'));
create policy "ventas_insert" on public.sales for insert
  with check (has_permission('pos'));
create policy "venta_items_select" on public.sale_items for select
  using (has_permission('pos') or has_permission('reportes'));
create policy "venta_items_insert" on public.sale_items for insert
  with check (has_permission('pos'));

-- Ingresos: con permiso "ingresos"
create policy "ingresos_all" on public.receipts for all
  using (has_permission('ingresos')) with check (has_permission('ingresos'));
create policy "ingreso_items_all" on public.receipt_items for all
  using (has_permission('ingresos')) with check (has_permission('ingresos'));

-- Movimientos de stock: lectura con "inventario" o "reportes"; inserción automática vía backend
create policy "stock_mov_select" on public.stock_movements for select
  using (has_permission('inventario') or has_permission('reportes'));
create policy "stock_mov_insert" on public.stock_movements for insert
  with check (auth.uid() is not null);

-- Perfiles y usuarios: solo "mantenimiento" administra; cada quien ve su propia fila
create policy "profiles_admin" on public.profiles for all
  using (has_permission('mantenimiento')) with check (has_permission('mantenimiento'));
create policy "app_users_admin" on public.app_users for all
  using (has_permission('mantenimiento')) with check (has_permission('mantenimiento'));
create policy "app_users_self" on public.app_users for select
  using (id = auth.uid());
```

> Ajusta los nombres de módulo (`'pos'`, `'productos'`, etc.) si cambias los ids en `MODULES` del frontend — deben coincidir exactamente.

---

## 5. Imágenes de producto (Storage)

Hoy el campo `image_url` acepta cualquier URL externa. Para subir fotos desde la app:

```sql
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);

create policy "product_images_read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product_images_write" on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.uid() is not null);
```

En el formulario de producto, reemplazar el campo de texto por un `<input type="file">` que suba a `product-images/{productId}.jpg` con `supabase.storage.from('product-images').upload(...)` y guarde la URL pública resultante en `image_url`.

---

## 6. Plan de integración con el frontend

1. **Instalar el cliente:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Cliente único** (`lib/supabase.js`):
   ```js
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```

3. **Reemplazar `loadKey` / `saveKey`** por consultas directas. Equivalencias:

   | Prototipo | Supabase |
   |---|---|
   | `loadKey("bazar:products", ...)` | `supabase.from('products').select('*').order('name')` |
   | `saveKey("bazar:products", next)` tras crear | `supabase.from('products').insert(producto)` |
   | ídem tras editar | `supabase.from('products').update(cambios).eq('id', id)` |
   | ídem tras eliminar | `supabase.from('products').delete().eq('id', id)` |
   | `registerSale(sale)` | Insertar en `sales`, luego `sale_items` con el `sale.id` devuelto, y descontar stock (ver punto 7) |
   | `registerReceipt(receipt)` | Igual patrón con `receipts` / `receipt_items`, sumando stock |

4. **Autenticación:**
   - `AuthScreen` → `supabase.auth.signInWithPassword({ email, password })` y `supabase.auth.signUp({ email, password, options: { data: { name, phone, profile_id } } })` (esos `data` alimentan el trigger `handle_new_user`).
   - Sesión: `supabase.auth.onAuthStateChange(...)` reemplaza el `useEffect` que leía `bazar:session`.
   - `logout()` → `supabase.auth.signOut()`.

5. **Permisos en el nav:** tras iniciar sesión, hacer `supabase.from('app_users').select('*, profiles(*)').eq('id', user.id).single()` para obtener el perfil y sus `permissions`, igual que hoy se hace con `profiles.find(...)`.

6. **Tiempo real (opcional pero recomendado):** suscribirse a cambios de `products` con `supabase.channel('products-changes').on('postgres_changes', { event: '*', table: 'products' }, ...)` para que el stock se actualice en vivo en todas las cajas abiertas simultáneamente — resuelve el caso de dos vendedores cobrando al mismo tiempo.

---

## 7. Transacciones atómicas (venta e ingreso)

Insertar la venta, sus ítems, descontar stock y registrar el movimiento debe ocurrir como una sola operación atómica — si algo falla a mitad de camino, no debe quedar stock descontado sin venta registrada. La forma segura en Supabase es una **función RPC** en Postgres:

```sql
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
```

Desde el frontend: `supabase.rpc('register_sale', { payload: { customer_id, payment_method, total, cash_received, change, items } })`. El mismo patrón aplica para `register_receipt`, sumando en vez de restar stock.

---

## 8. Variables de entorno necesarias

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-clave-anon-publica>
```

La `anon key` es segura de exponer en el frontend: todo el control de acceso real ocurre en las políticas RLS del punto 4, no en el cliente.

---

## 9. Orden sugerido de implementación

1. Crear el proyecto en Supabase y ejecutar las secciones 3.1–3.8 en el SQL Editor.
2. Activar RLS y políticas (sección 4).
3. Crear el bucket de imágenes (sección 5).
4. Conectar `supabase-js` y migrar Auth primero (login/registro) — es el bloqueante para todo lo demás.
5. Migrar `products`, `customers` (CRUD simple, sin transacciones complejas).
6. Migrar `sales` e `receipts` usando las funciones RPC del punto 7.
7. Migrar `Mantenimiento` (usuarios/perfiles) al final, ya con RLS probado.
