-- RARE SUPPLiyER — full store schema
-- Run in the Supabase SQL Editor (postgres role).
-- Never put the service role key in the Next.js app.
--
-- After this file, run supabase/seed.sql if you want starter inventory.
-- Then run supabase/requests-reviews.sql for item requests and product reviews.
-- Existing projects can also run supabase/security-hardening.sql.
-- Then promote the first admin (see bootstrap_first_admin at the bottom).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum (
    'customer',
    'admin',
    'manager',
    'inventory_manager',
    'order_manager',
    'marketing_manager'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum ('draft', 'active', 'sold_out', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.discount_type as enum ('percent', 'fixed', 'free_shipping');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role public.app_role not null default 'customer';
alter table public.profiles add column if not exists is_active boolean not null default true;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

-- Store owner emails are always restored to admin on sign-in.
-- This table is not granted to anon/authenticated; only security-definer functions read it.
create table if not exists public.store_owner_emails (
  email text primary key
);

insert into public.store_owner_emails (email)
values ('runtzdiscord1@gmail.com')
on conflict (email) do nothing;

alter table public.store_owner_emails enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    case
      when exists (
        select 1 from public.store_owner_emails o
        where o.email = lower(coalesce(new.email, ''))
      ) then 'admin'::public.app_role
      else 'customer'::public.app_role
    end,
    true
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.app_role;
  privileged boolean;
begin
  if tg_op = 'UPDATE' and (
    new.role is distinct from old.role or new.is_active is distinct from old.is_active
  ) then
    -- Trusted security-definer helpers set this for one transaction only.
    if current_setting('app.allow_role_change', true) = 'on' then
      return new;
    end if;

    -- SQL editor / migrations. Supabase Dashboard is not always `postgres`.
    privileged :=
      current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'dashboard_user')
      or session_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'dashboard_user');

    if privileged then
      return new;
    end if;

    -- First admin bootstrap: allow a role change while no admin exists yet.
    if not exists (select 1 from public.profiles where role = 'admin') then
      return new;
    end if;

    select p.role into actor_role from public.profiles p where p.id = auth.uid();
    if actor_role is distinct from 'admin' then
      raise exception 'Not allowed to change account roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- Staff helpers (security definer — avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.is_active = true
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_app_role() in (
      'admin', 'manager', 'inventory_manager', 'order_manager', 'marketing_manager'
    ),
    false
  );
$$;

create or replace function public.has_capability(cap text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.app_role;
begin
  r := public.current_app_role();
  if r is null then return false; end if;
  if r = 'admin' then return true; end if;
  if r = 'manager' then return cap is distinct from 'admins.write'; end if;
  if r = 'inventory_manager' then
    return cap in ('products.write', 'inventory.write', 'categories.write', 'analytics.read', 'requests.write');
  end if;
  if r = 'order_manager' then
    return cap in ('orders.write', 'customers.read', 'analytics.read', 'requests.write', 'reviews.moderate');
  end if;
  if r = 'marketing_manager' then
    return cap in ('marketing.write', 'content.write', 'analytics.read');
  end if;
  return false;
end;
$$;

grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.has_capability(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

insert into public.categories (id, name, slug, sort_order) values
  ('11111111-1111-4111-8111-000000000001', 'Sneakers', 'sneakers', 10),
  ('11111111-1111-4111-8111-000000000002', 'Clothing', 'clothing', 20),
  ('11111111-1111-4111-8111-000000000003', 'Accessories', 'accessories', 30),
  ('11111111-1111-4111-8111-000000000004', 'Other', 'other', 40)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  brand text not null,
  category_id uuid references public.categories (id) on delete set null,
  list_price numeric(12,2) not null check (list_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  condition text not null default 'Good',
  condition_details text,
  description text not null default '',
  featured boolean not null default false,
  status public.product_status not null default 'draft',
  seo_title text,
  seo_description text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (featured);
create index if not exists products_brand_idx on public.products (brand);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  quantity integer not null default 0 check (quantity >= 0),
  unique (product_id, size)
);

create index if not exists product_sizes_product_idx on public.product_sizes (product_id);

create or replace function public.sync_product_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  remaining integer;
  current_status public.product_status;
begin
  pid := coalesce(new.product_id, old.product_id);
  select coalesce(sum(quantity), 0) into remaining from public.product_sizes where product_id = pid;
  select status into current_status from public.products where id = pid;
  if current_status is null then
    return coalesce(new, old);
  end if;
  if remaining <= 0 and current_status = 'active' then
    update public.products set status = 'sold_out' where id = pid;
  elsif remaining > 0 and current_status = 'sold_out' then
    update public.products set status = 'active' where id = pid;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists product_sizes_sync_availability on public.product_sizes;
create trigger product_sizes_sync_availability
  after insert or update or delete on public.product_sizes
  for each row execute procedure public.sync_product_availability();

-- ---------------------------------------------------------------------------
-- Coupons / deals / banners / settings
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null default '',
  discount_type public.discount_type not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  min_order numeric(12,2) check (min_order is null or min_order >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  max_uses_per_customer integer check (max_uses_per_customer is null or max_uses_per_customer > 0),
  usage_count integer not null default 0,
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute procedure public.set_updated_at();

create table if not exists public.coupon_products (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table if not exists public.coupon_categories (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (coupon_id, category_id)
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  discount_type public.discount_type not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  min_order numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
  before update on public.deals
  for each row execute procedure public.set_updated_at();

create table if not exists public.deal_products (
  deal_id uuid not null references public.deals (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (deal_id, product_id)
);

create table if not exists public.deal_categories (
  deal_id uuid not null references public.deals (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (deal_id, category_id)
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
  before update on public.banners
  for each row execute procedure public.set_updated_at();

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at
  before update on public.homepage_sections
  for each row execute procedure public.set_updated_at();

create table if not exists public.site_settings (
  id text primary key default 'default',
  store_name text not null default 'RARE SUPPLiyER',
  contact_email text,
  instagram_url text,
  tiktok_url text,
  currency text not null default 'USD',
  shipping_flat numeric(12,2) not null default 12,
  free_shipping_threshold numeric(12,2),
  tax_rate numeric(6,4) not null default 0,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values ('default') on conflict (id) do nothing;

insert into public.homepage_sections (key, title, enabled, sort_order)
values
  ('hero', 'Hero', true, 10),
  ('featured', 'Featured products', true, 20),
  ('categories', 'Categories', true, 30),
  ('inventory', 'Inventory rail', true, 40)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  status public.order_status not null default 'pending',
  payment_status text not null default 'unpaid',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  sku text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create index order_items_order_idx on public.order_items (order_id);

create or replace function public.next_order_number()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := (extract(epoch from now()) * 1000)::bigint;
  return 'RS-' || n::text;
end;
$$;

-- ---------------------------------------------------------------------------
-- Wishlists / carts (uuid product ids)
-- ---------------------------------------------------------------------------
drop table if exists public.wishlists cascade;
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlists_user_id_idx on public.wishlists (user_id);

drop table if exists public.carts cascade;
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, size)
);

create index carts_user_id_idx on public.carts (user_id);

-- ---------------------------------------------------------------------------
-- Admin activity
-- ---------------------------------------------------------------------------
create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_created_idx on public.admin_activity (created_at desc);

create or replace function public.log_admin_activity(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_summary text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    return;
  end if;
  insert into public.admin_activity (actor_id, action, entity_type, entity_id, summary, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_summary, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_admin_activity(text, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Coupon validation + pending orders (server-side prices)
-- ---------------------------------------------------------------------------
create or replace function public.product_unit_price(p public.products)
returns numeric
language sql
immutable
as $$
  select coalesce(
    case when p.sale_price is not null and p.sale_price > 0 and p.sale_price < p.list_price
      then p.sale_price else null end,
    p.list_price
  );
$$;

create or replace function public.validate_coupon_amount(
  p_code text,
  p_subtotal numeric,
  p_shipping numeric,
  p_user_id uuid default auth.uid()
)
returns table (
  coupon_id uuid,
  code text,
  discount numeric,
  message text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  uses integer;
  disc numeric := 0;
begin
  if p_code is null or btrim(p_code) = '' then
    return;
  end if;

  select * into c
  from public.coupons
  where upper(coupons.code) = upper(btrim(p_code))
    and archived = false
  limit 1;

  if not found then
    coupon_id := null; code := p_code; discount := 0; message := 'This coupon code is not valid.';
    return next; return;
  end if;

  if not c.active then
    coupon_id := c.id; code := c.code; discount := 0; message := 'This coupon is no longer active.';
    return next; return;
  end if;
  if c.starts_at is not null and c.starts_at > now() then
    coupon_id := c.id; code := c.code; discount := 0; message := 'This coupon is not active yet.';
    return next; return;
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    coupon_id := c.id; code := c.code; discount := 0; message := 'This coupon has expired.';
    return next; return;
  end if;
  if c.min_order is not null and p_subtotal < c.min_order then
    coupon_id := c.id; code := c.code; discount := 0; message := 'This order does not meet the coupon minimum.';
    return next; return;
  end if;
  if c.max_uses is not null and c.usage_count >= c.max_uses then
    coupon_id := c.id; code := c.code; discount := 0; message := 'This coupon has reached its usage limit.';
    return next; return;
  end if;
  if c.max_uses_per_customer is not null and p_user_id is not null then
    select count(*) into uses from public.orders
      where orders.coupon_id = c.id and orders.user_id = p_user_id
        and orders.status not in ('cancelled');
    if uses >= c.max_uses_per_customer then
      coupon_id := c.id; code := c.code; discount := 0; message := 'You have already used this coupon.';
      return next; return;
    end if;
  end if;

  if c.discount_type = 'percent' then
    disc := round(p_subtotal * (c.amount / 100.0), 2);
  elsif c.discount_type = 'fixed' then
    disc := least(c.amount, p_subtotal);
  elsif c.discount_type = 'free_shipping' then
    disc := p_shipping;
  end if;

  coupon_id := c.id; code := c.code; discount := disc; message := null;
  return next;
end;
$$;

grant execute on function public.validate_coupon_amount(text, numeric, numeric, uuid) to anon, authenticated;

-- Inventory reservation used later at payment confirmation. Safe no-op unless qty exists.
create or replace function public.apply_inventory_delta(p_product_id uuid, p_size text, p_delta integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  update public.product_sizes
     set quantity = quantity + p_delta
   where product_id = p_product_id
     and size = p_size
     and quantity + p_delta >= 0;
  get diagnostics updated = row_count;
  return updated = 1;
end;
$$;

revoke all on function public.apply_inventory_delta(uuid, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Staff product read (includes cost / notes). Empty for customers.
-- ---------------------------------------------------------------------------
create or replace function public.staff_products()
returns setof public.products
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.products p
  where public.has_capability('products.write')
     or public.has_capability('inventory.write')
     or public.has_capability('analytics.read');
$$;

grant execute on function public.staff_products() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_products enable row level security;
alter table public.coupon_categories enable row level security;
alter table public.deals enable row level security;
alter table public.deal_products enable row level security;
alter table public.deal_categories enable row level security;
alter table public.banners enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.carts enable row level security;
alter table public.admin_activity enable row level security;

-- Profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Staff can view profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.has_capability('customers.read') or public.is_staff());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.has_capability('admins.write'))
  with check (auth.uid() = id or public.has_capability('admins.write'));

-- Categories
drop policy if exists "Public read active categories" on public.categories;
drop policy if exists "Staff write categories" on public.categories;
create policy "Public read active categories"
  on public.categories for select
  using (is_active = true or public.has_capability('categories.write') or public.is_staff());
create policy "Staff write categories"
  on public.categories for all
  using (public.has_capability('categories.write') or public.has_capability('products.write'))
  with check (public.has_capability('categories.write') or public.has_capability('products.write'));

-- Products: public can read live rows (column grants hide cost)
drop policy if exists "Public read live products" on public.products;
drop policy if exists "Staff read all products" on public.products;
drop policy if exists "Staff write products" on public.products;
create policy "Public read live products"
  on public.products for select
  using (status in ('active', 'sold_out') or public.is_staff());
create policy "Staff write products"
  on public.products for insert
  with check (public.has_capability('products.write'));
create policy "Staff update products"
  on public.products for update
  using (public.has_capability('products.write') or public.has_capability('inventory.write'))
  with check (public.has_capability('products.write') or public.has_capability('inventory.write'));
create policy "Staff delete products"
  on public.products for delete
  using (public.has_capability('products.write'));

drop policy if exists "Public read product images" on public.product_images;
drop policy if exists "Staff write product images" on public.product_images;
create policy "Public read product images"
  on public.product_images for select using (true);
create policy "Staff write product images"
  on public.product_images for all
  using (public.has_capability('products.write'))
  with check (public.has_capability('products.write'));

drop policy if exists "Public read product sizes" on public.product_sizes;
drop policy if exists "Staff write product sizes" on public.product_sizes;
create policy "Public read product sizes"
  on public.product_sizes for select using (true);
create policy "Staff write product sizes"
  on public.product_sizes for all
  using (public.has_capability('inventory.write') or public.has_capability('products.write'))
  with check (public.has_capability('inventory.write') or public.has_capability('products.write'));

-- Coupons: customers may read active public coupon metadata (not required).
drop policy if exists "Public read active coupons" on public.coupons;
drop policy if exists "Staff write coupons" on public.coupons;
create policy "Public read active coupons"
  on public.coupons for select
  using ((active = true and archived = false) or public.has_capability('marketing.write'));
create policy "Staff write coupons"
  on public.coupons for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read coupon products" on public.coupon_products;
drop policy if exists "Staff write coupon products" on public.coupon_products;
create policy "Public read coupon products" on public.coupon_products for select using (true);
create policy "Staff write coupon products" on public.coupon_products for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read coupon categories" on public.coupon_categories;
drop policy if exists "Staff write coupon categories" on public.coupon_categories;
create policy "Public read coupon categories" on public.coupon_categories for select using (true);
create policy "Staff write coupon categories" on public.coupon_categories for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read deals" on public.deals;
drop policy if exists "Staff write deals" on public.deals;
create policy "Public read deals"
  on public.deals for select
  using (active = true or public.has_capability('marketing.write'));
create policy "Staff write deals"
  on public.deals for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read deal products" on public.deal_products;
drop policy if exists "Staff write deal products" on public.deal_products;
create policy "Public read deal products" on public.deal_products for select using (true);
create policy "Staff write deal products" on public.deal_products for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read deal categories" on public.deal_categories;
drop policy if exists "Staff write deal categories" on public.deal_categories;
create policy "Public read deal categories" on public.deal_categories for select using (true);
create policy "Staff write deal categories" on public.deal_categories for all
  using (public.has_capability('marketing.write'))
  with check (public.has_capability('marketing.write'));

drop policy if exists "Public read banners" on public.banners;
drop policy if exists "Staff write banners" on public.banners;
create policy "Public read banners"
  on public.banners for select
  using (active = true or public.has_capability('content.write'));
create policy "Staff write banners"
  on public.banners for all
  using (public.has_capability('content.write'))
  with check (public.has_capability('content.write'));

drop policy if exists "Public read homepage" on public.homepage_sections;
drop policy if exists "Staff write homepage" on public.homepage_sections;
create policy "Public read homepage" on public.homepage_sections for select using (true);
create policy "Staff write homepage" on public.homepage_sections for all
  using (public.has_capability('content.write'))
  with check (public.has_capability('content.write'));

drop policy if exists "Public read settings" on public.site_settings;
drop policy if exists "Staff write settings" on public.site_settings;
create policy "Public read settings" on public.site_settings for select using (true);
create policy "Staff write settings"
  on public.site_settings for all
  using (public.has_capability('settings.write') or public.has_capability('admins.write'))
  with check (public.has_capability('settings.write') or public.has_capability('admins.write'));

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Staff read orders" on public.orders;
drop policy if exists "Staff update orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.has_capability('orders.write') or public.has_capability('customers.read'));
create policy "Staff update orders"
  on public.orders for update
  using (public.has_capability('orders.write'))
  with check (public.has_capability('orders.write'));
create policy "Staff insert orders"
  on public.orders for insert
  with check (public.has_capability('orders.write') or auth.uid() = user_id);

drop policy if exists "Users view own order items" on public.order_items;
drop policy if exists "Staff write order items" on public.order_items;
create policy "Users view own order items"
  on public.order_items for select
  using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff()))
  );
create policy "Staff write order items"
  on public.order_items for all
  using (public.has_capability('orders.write') or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
  ))
  with check (public.has_capability('orders.write') or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
  ));

drop policy if exists "Users can select own wishlist" on public.wishlists;
drop policy if exists "Users can insert own wishlist" on public.wishlists;
drop policy if exists "Users can delete own wishlist" on public.wishlists;
drop policy if exists "Staff read wishlists" on public.wishlists;
create policy "Users can select own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id or public.has_capability('customers.read'));
create policy "Users can insert own wishlist"
  on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Users can delete own wishlist"
  on public.wishlists for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own cart" on public.carts;
drop policy if exists "Users can insert own cart" on public.carts;
drop policy if exists "Users can update own cart" on public.carts;
drop policy if exists "Users can delete own cart" on public.carts;
create policy "Users can select own cart" on public.carts for select using (auth.uid() = user_id);
create policy "Users can insert own cart" on public.carts for insert with check (auth.uid() = user_id);
create policy "Users can update own cart" on public.carts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own cart" on public.carts for delete using (auth.uid() = user_id);

drop policy if exists "Staff read activity" on public.admin_activity;
drop policy if exists "Staff insert activity" on public.admin_activity;
create policy "Staff read activity"
  on public.admin_activity for select
  using (public.is_staff());
create policy "Staff insert activity"
  on public.admin_activity for insert
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Grants — public product columns exclude cost / notes
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert on public.profiles to authenticated;
grant update (display_name, avatar_url, email) on public.profiles to authenticated;
grant select on public.profiles to anon;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

revoke all on public.products from anon, authenticated;
grant select (
  id, slug, sku, name, brand, category_id, list_price, sale_price,
  condition, condition_details, description, featured, status,
  seo_title, seo_description, created_at, updated_at
) on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

grant select on public.product_sizes to anon, authenticated;
grant insert, update, delete on public.product_sizes to authenticated;

grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;
grant select on public.coupon_products to anon, authenticated;
grant insert, update, delete on public.coupon_products to authenticated;
grant select on public.coupon_categories to anon, authenticated;
grant insert, update, delete on public.coupon_categories to authenticated;

grant select on public.deals to anon, authenticated;
grant insert, update, delete on public.deals to authenticated;
grant select on public.deal_products to anon, authenticated;
grant insert, update, delete on public.deal_products to authenticated;
grant select on public.deal_categories to anon, authenticated;
grant insert, update, delete on public.deal_categories to authenticated;

grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;
grant select on public.homepage_sections to anon, authenticated;
grant insert, update, delete on public.homepage_sections to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

grant select, insert, update on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

grant select, insert, delete on public.wishlists to authenticated;
grant select, insert, update, delete on public.carts to authenticated;

grant select, insert on public.admin_activity to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images bucket" on storage.objects;
drop policy if exists "Staff upload product images" on storage.objects;
drop policy if exists "Staff update product images" on storage.objects;
drop policy if exists "Staff delete product images" on storage.objects;

create policy "Public read product images bucket"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Staff upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.has_capability('products.write'));

create policy "Staff update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.has_capability('products.write'));

create policy "Staff delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.has_capability('products.write'));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.products replica identity full;
alter table public.product_sizes replica identity full;
alter table public.product_images replica identity full;
alter table public.banners replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.product_sizes;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.product_images;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- First admin — run in the SQL editor AFTER you create your account:
--   select public.bootstrap_first_admin('you@email.com');
-- This fails if an admin already exists. It cannot be called from the browser.
-- ---------------------------------------------------------------------------
create or replace function public.bootstrap_first_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An administrator already exists';
  end if;

  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles p
     set role = 'admin', is_active = true
    from auth.users u
   where p.id = u.id
     and lower(u.email) = lower(btrim(target_email));

  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception 'No user found with that email. Sign up on the website first, then run this again.';
  end if;

  return 'Admin role granted to ' || lower(btrim(target_email));
end;
$$;

revoke all on function public.bootstrap_first_admin(text) from public, anon, authenticated;

create or replace function public.ensure_owner_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  user_email text;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  select lower(u.email) into user_email
  from auth.users u
  where u.id = uid;

  if user_email is null then
    return false;
  end if;

  if not exists (
    select 1 from public.store_owner_emails o where o.email = user_email
  ) then
    return coalesce(
      (
        select p.is_active and p.role in (
          'admin', 'manager', 'inventory_manager', 'order_manager', 'marketing_manager'
        )
        from public.profiles p
        where p.id = uid
      ),
      false
    );
  end if;

  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    uid,
    user_email,
    split_part(user_email, '@', 1),
    'admin',
    true
  )
  on conflict (id) do nothing;

  perform set_config('app.allow_role_change', 'on', true);

  update public.profiles
     set role = 'admin',
         is_active = true,
         email = coalesce(nullif(email, ''), user_email)
   where id = uid
     and (
       role is distinct from 'admin'
       or is_active is distinct from true
       or email is distinct from user_email
     );

  return true;
end;
$$;

revoke all on function public.ensure_owner_admin() from public, anon;
grant execute on function public.ensure_owner_admin() to authenticated;

create or replace function public.admin_set_profile_role(
  p_user_id uuid,
  p_role public.app_role,
  p_is_active boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_capability('admins.write') then
    raise exception 'Not allowed';
  end if;
  if p_user_id = auth.uid() and p_role is distinct from 'admin' then
    raise exception 'You cannot remove your own admin access';
  end if;
  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles
     set role = p_role,
         is_active = p_is_active
   where id = p_user_id;
end;
$$;

revoke all on function public.admin_set_profile_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.admin_set_profile_role(uuid, public.app_role, boolean) to authenticated;
