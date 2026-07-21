-- =========================================================
-- Esquema inicial: Perfumería Joaquín
-- Correr esto en el SQL Editor de Supabase (proyecto nuevo)
-- =========================================================

-- Extensión para generar uuids
create extension if not exists "pgcrypto";

-- =========================================================
-- Tabla: categories
-- =========================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Tabla: products
-- =========================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  brand text,
  category_id uuid references categories(id) on delete set null,
  ml integer,
  installments_enabled boolean not null default true,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);
create index products_active_idx on products(active);

-- =========================================================
-- Tabla: shipping_rules
-- =========================================================
create table shipping_rules (
  id uuid primary key default gen_random_uuid(),
  zone text not null check (zone in ('local', 'nacional')),
  free_from_amount numeric(12, 2),
  fixed_cost numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- Datos iniciales de envío, según lo que ya ofrece la tienda actual
insert into shipping_rules (zone, free_from_amount, fixed_cost) values
  ('local', 0, 0),          -- San Carlos de Bolívar: siempre gratis
  ('nacional', 100000, 0);  -- gratis a nivel nacional desde $100.000 (ajustar fixed_cost si no llega al mínimo)

-- =========================================================
-- Tabla: orders
-- =========================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  items jsonb not null,           -- snapshot de productos y cantidades al momento de compra
  total numeric(12, 2) not null,  -- SIEMPRE calculado en el servidor
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  mp_payment_id text,
  mp_preference_id text,
  created_at timestamptz not null default now()
);

create index orders_status_idx on orders(status);
create index orders_mp_payment_id_idx on orders(mp_payment_id);

-- =========================================================
-- Tabla: admin_users
-- Guarda qué usuarios de Supabase Auth son administradores.
-- Para este proyecto va a tener una sola fila (el dueño del
-- negocio), pero queda preparado por si mañana se suma alguien.
-- =========================================================
create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Nadie puede leer/escribir esta tabla desde el cliente (ni siquiera
-- el propio admin autenticado); se administra a mano desde el SQL
-- Editor de Supabase o con la service_role key en el servidor.
-- Al no crear ninguna policy, el acceso queda denegado por defecto.

-- Función helper: ¿el usuario actual es admin?
-- security definer permite que la función consulte admin_users
-- (que no tiene policies) sin que quien la llama necesite acceso directo.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$;

-- =========================================================
-- Row Level Security (RLS) — activado en TODAS las tablas
-- =========================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table shipping_rules enable row level security;
alter table orders enable row level security;

-- ---------------------------------------------------------
-- categories: lectura pública, escritura solo admin autenticado
-- ---------------------------------------------------------
create policy "categories: lectura pública"
  on categories for select
  to anon, authenticated
  using (true);

create policy "categories: escritura solo admin"
  on categories for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------
-- products: lectura pública de productos activos, escritura solo admin
-- ---------------------------------------------------------
create policy "products: lectura pública de activos"
  on products for select
  to anon, authenticated
  using (active = true);

create policy "products: admin ve todo (incluidos inactivos)"
  on products for select
  to authenticated
  using (is_admin());

create policy "products: insert solo admin"
  on products for insert
  to authenticated
  with check (is_admin());

create policy "products: update solo admin"
  on products for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "products: delete solo admin"
  on products for delete
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------
-- shipping_rules: lectura pública, escritura solo admin
-- ---------------------------------------------------------
create policy "shipping_rules: lectura pública"
  on shipping_rules for select
  to anon, authenticated
  using (true);

create policy "shipping_rules: escritura solo admin"
  on shipping_rules for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------------------------------------------------------
-- orders: NADIE lee/escribe desde el cliente (ni anon ni
-- authenticated no-admin). Todo pedido se crea y se confirma
-- desde API routes usando la service_role key (que bypassea
-- RLS), nunca desde el navegador. Solo el admin puede LEER
-- pedidos, para mostrarlos en el panel.
-- ---------------------------------------------------------
create policy "orders: admin puede leer todo"
  on orders for select
  to authenticated
  using (is_admin());

-- =========================================================
-- Para dar de alta al admin (una sola vez, después de crear
-- el usuario en Authentication > Users desde el dashboard):
--
--   insert into admin_users (user_id)
--   values ('UUID-DEL-USUARIO-CREADO');
-- =========================================================
