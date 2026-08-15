-- RARE SUPPLiyER — item requests + product reviews
-- Run AFTER supabase/schema.sql in the SQL Editor (postgres role).
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.item_request_status as enum (
    'submitted',
    'under_review',
    'looking',
    'found',
    'available',
    'unable_to_source',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.item_request_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected', 'hidden');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.moderation_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.review_report_reason as enum ('spam', 'offensive', 'fake', 'inappropriate', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_email_status as enum ('queued', 'sent', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Item requests
-- ---------------------------------------------------------------------------
create table if not exists public.item_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_name text not null,
  brand text not null default '',
  category text not null default 'Other'
    check (category in ('Sneakers', 'Clothing', 'Accessories', 'Other')),
  size text,
  color text,
  condition_preference text not null default 'Any'
    check (condition_preference in ('New', 'Like New', 'Excellent', 'Good', 'Any')),
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  budget_text text,
  details text,
  status public.item_request_status not null default 'submitted',
  priority public.item_request_priority not null default 'normal',
  admin_response text,
  assigned_to uuid references public.profiles(id) on delete set null,
  linked_product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_requests_name_len check (char_length(btrim(product_name)) between 1 and 200)
);

create index if not exists item_requests_user_idx on public.item_requests (user_id, created_at desc);
create index if not exists item_requests_status_idx on public.item_requests (status, created_at desc);
create index if not exists item_requests_brand_idx on public.item_requests (lower(brand));
create index if not exists item_requests_category_idx on public.item_requests (category);
create index if not exists item_requests_priority_idx on public.item_requests (priority);
create index if not exists item_requests_assigned_idx on public.item_requests (assigned_to);

drop trigger if exists item_requests_set_updated_at on public.item_requests;
create trigger item_requests_set_updated_at
  before update on public.item_requests
  for each row execute procedure public.set_updated_at();

create table if not exists public.item_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.item_requests(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint item_request_notes_body_len check (char_length(btrim(body)) between 1 and 4000)
);

create index if not exists item_request_notes_request_idx on public.item_request_notes (request_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Notifications (in-account now; email_status queued for a future mailer)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  email_template text,
  email_status public.notification_email_status not null default 'queued',
  email_sent_at timestamptz,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index if not exists notifications_email_idx on public.notifications (email_status, created_at)
  where email_status = 'queued';

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  size_purchased text,
  status public.review_status not null default 'pending',
  verified_purchase boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint reviews_body_len check (char_length(btrim(body)) between 1 and 4000),
  constraint reviews_one_per_product unique (user_id, product_id)
);

create index if not exists reviews_product_status_idx on public.reviews (product_id, status) where archived = false;
create index if not exists reviews_user_idx on public.reviews (user_id, created_at desc);
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

create table if not exists public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  storage_path text not null,
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists review_images_review_idx on public.review_images (review_id, status);

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason public.review_report_reason not null,
  details text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint review_reports_unique unique (review_id, reporter_id)
);

create index if not exists review_reports_open_idx on public.review_reports (created_at desc) where resolved = false;

-- Public rating is computed from approved reviews only.
create or replace view public.product_ratings
with (security_invoker = true) as
select
  product_id,
  round(avg(rating)::numeric, 1) as average_rating,
  count(*)::int as review_count,
  count(*) filter (where rating = 5)::int as stars_5,
  count(*) filter (where rating = 4)::int as stars_4,
  count(*) filter (where rating = 3)::int as stars_3,
  count(*) filter (where rating = 2)::int as stars_2,
  count(*) filter (where rating = 1)::int as stars_1
from public.reviews
where status = 'approved' and archived = false
group by product_id;

-- ---------------------------------------------------------------------------
-- Notification helper (triggers + staff only; not callable as a customer spam API)
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text default null,
  p_email_template text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nid uuid;
begin
  if p_user_id is null then
    return null;
  end if;
  insert into public.notifications (
    user_id, type, title, body, href, email_template, email_status, metadata
  ) values (
    p_user_id, p_type, p_title, p_body, p_href, p_email_template, 'queued', coalesce(p_metadata, '{}'::jsonb)
  ) returning id into nid;
  return nid;
end;
$$;

revoke all on function public.enqueue_notification(uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.notify_item_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.enqueue_notification(
      new.user_id,
      'request.received',
      'Request received',
      'Thanks! We''ve received your request and will review it.',
      '/account/requests/' || new.id::text,
      'request_received',
      jsonb_build_object('request_id', new.id, 'status', new.status)
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'found' then
      perform public.enqueue_notification(
        new.user_id,
        'request.found',
        'We found it',
        'We found a possible match for the item you requested.',
        '/account/requests/' || new.id::text,
        'request_found',
        jsonb_build_object('request_id', new.id, 'status', new.status)
      );
    elsif new.status = 'available' then
      perform public.enqueue_notification(
        new.user_id,
        'request.available',
        'The item you requested is now available',
        'The item you requested is now available. It is not reserved — shop it while it lasts.',
        '/account/requests/' || new.id::text,
        'request_available',
        jsonb_build_object('request_id', new.id, 'status', new.status, 'product_id', new.linked_product_id)
      );
    elsif new.status = 'unable_to_source' then
      perform public.enqueue_notification(
        new.user_id,
        'request.unable',
        'We were unable to source this item',
        'We could not find the item you requested right now.',
        '/account/requests/' || new.id::text,
        'request_unable',
        jsonb_build_object('request_id', new.id, 'status', new.status)
      );
    elsif new.status = 'cancelled' then
      perform public.enqueue_notification(
        new.user_id,
        'request.status',
        'Request cancelled',
        'This request has been cancelled.',
        '/account/requests/' || new.id::text,
        'request_status_changed',
        jsonb_build_object('request_id', new.id, 'status', new.status)
      );
    else
      perform public.enqueue_notification(
        new.user_id,
        'request.status',
        'Request update',
        'There is an update on your item request.',
        '/account/requests/' || new.id::text,
        'request_status_changed',
        jsonb_build_object('request_id', new.id, 'status', new.status)
      );
    end if;
  elsif new.admin_response is distinct from old.admin_response and new.admin_response is not null then
    perform public.enqueue_notification(
      new.user_id,
      'request.status',
      'Request update',
      'There is a new update on your item request.',
      '/account/requests/' || new.id::text,
      'request_status_changed',
      jsonb_build_object('request_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists item_requests_notify on public.item_requests;
create trigger item_requests_notify
  after insert or update of status, admin_response, linked_product_id
  on public.item_requests
  for each row execute procedure public.notify_item_request_change();

create or replace function public.protect_item_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_capability('requests.write') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'submitted';
    new.priority := 'normal';
    new.admin_response := null;
    new.assigned_to := null;
    new.linked_product_id := null;
    new.product_name := left(btrim(new.product_name), 200);
    new.brand := left(btrim(coalesce(new.brand, '')), 80);
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.status = 'cancelled'
     and old.status in ('submitted', 'under_review', 'looking')
     and old.user_id = auth.uid() then
    new.user_id := old.user_id;
    new.product_name := old.product_name;
    new.brand := old.brand;
    new.category := old.category;
    new.size := old.size;
    new.color := old.color;
    new.condition_preference := old.condition_preference;
    new.budget_min := old.budget_min;
    new.budget_max := old.budget_max;
    new.budget_text := old.budget_text;
    new.details := old.details;
    new.priority := old.priority;
    new.admin_response := old.admin_response;
    new.assigned_to := old.assigned_to;
    new.linked_product_id := old.linked_product_id;
    new.status := 'cancelled';
    return new;
  end if;

  raise exception 'Not allowed';
end;
$$;

drop trigger if exists item_requests_protect on public.item_requests;
create trigger item_requests_protect
  before insert or update on public.item_requests
  for each row execute procedure public.protect_item_request();

create or replace function public.customer_purchased_product(p_user_id uuid, p_product_id uuid, p_order_id uuid, p_order_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = p_user_id
      and oi.product_id = p_product_id
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
      and (p_order_id is null or o.id = p_order_id)
      and (p_order_item_id is null or oi.id = p_order_item_id)
  );
$$;

revoke all on function public.customer_purchased_product(uuid, uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.protect_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  purchased boolean;
  item_size text;
  item_order uuid;
begin
  if public.has_capability('reviews.moderate') then
    if tg_op = 'INSERT' then
      purchased := public.customer_purchased_product(new.user_id, new.product_id, new.order_id, new.order_item_id);
      new.verified_purchase := purchased;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.archived := false;
    purchased := public.customer_purchased_product(new.user_id, new.product_id, new.order_id, new.order_item_id);
    new.verified_purchase := purchased;
    if new.order_item_id is not null then
      select oi.size, oi.order_id into item_size, item_order
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = new.order_item_id
        and o.user_id = auth.uid()
        and oi.product_id = new.product_id;
      if item_order is null then
        new.order_item_id := null;
        new.order_id := null;
      else
        new.order_id := item_order;
        if new.size_purchased is null or btrim(new.size_purchased) = '' then
          new.size_purchased := item_size;
        end if;
      end if;
    end if;
    new.rating := greatest(1, least(5, new.rating));
    return new;
  end if;

  if old.user_id is distinct from auth.uid() then
    raise exception 'Not allowed';
  end if;
  new.user_id := old.user_id;
  new.product_id := old.product_id;
  new.order_id := old.order_id;
  new.order_item_id := old.order_item_id;
  new.verified_purchase := old.verified_purchase;
  new.archived := old.archived;
  new.status := 'pending';
  new.rating := greatest(1, least(5, new.rating));
  return new;
end;
$$;

drop trigger if exists reviews_protect on public.reviews;
create trigger reviews_protect
  before insert or update on public.reviews
  for each row execute procedure public.protect_review();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.cancel_my_item_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.item_requests
     set status = 'cancelled'
   where id = p_id
     and user_id = auth.uid()
     and status in ('submitted', 'under_review', 'looking');
  if not found then
    raise exception 'This request cannot be cancelled';
  end if;
end;
$$;

grant execute on function public.cancel_my_item_request(uuid) to authenticated;

create or replace function public.staff_item_requests()
returns setof public.item_requests
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.item_requests r
  where public.has_capability('requests.write')
     or public.has_capability('customers.read')
     or public.has_capability('analytics.read');
$$;

grant execute on function public.staff_item_requests() to authenticated;

create or replace function public.admin_update_item_request(
  p_id uuid,
  p_status public.item_request_status default null,
  p_priority public.item_request_priority default null,
  p_admin_response text default null,
  p_assigned_to uuid default null,
  p_linked_product_id uuid default null,
  p_clear_assignee boolean default false,
  p_clear_product boolean default false
) returns public.item_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.item_requests;
begin
  if not public.has_capability('requests.write') then
    raise exception 'Not allowed';
  end if;

  update public.item_requests
     set status = coalesce(p_status, status),
         priority = coalesce(p_priority, priority),
         admin_response = coalesce(p_admin_response, admin_response),
         assigned_to = case
           when p_clear_assignee then null
           else coalesce(p_assigned_to, assigned_to)
         end,
         linked_product_id = case
           when p_clear_product then null
           else coalesce(p_linked_product_id, linked_product_id)
         end
   where id = p_id
   returning * into row;

  if row.id is null then
    raise exception 'Request not found';
  end if;
  return row;
end;
$$;

grant execute on function public.admin_update_item_request(uuid, public.item_request_status, public.item_request_priority, text, uuid, uuid, boolean, boolean) to authenticated;

create or replace function public.admin_add_request_note(p_request_id uuid, p_body text)
returns public.item_request_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  note public.item_request_notes;
begin
  if not public.has_capability('requests.write') then
    raise exception 'Not allowed';
  end if;
  insert into public.item_request_notes (request_id, author_id, body)
  values (p_request_id, auth.uid(), btrim(p_body))
  returning * into note;
  return note;
end;
$$;

grant execute on function public.admin_add_request_note(uuid, text) to authenticated;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null
     and (p_ids is null or id = any (p_ids));
end;
$$;

grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function public.admin_moderate_review(
  p_id uuid,
  p_status public.review_status default null,
  p_archived boolean default null
) returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.reviews;
begin
  if not public.has_capability('reviews.moderate') then
    raise exception 'Not allowed';
  end if;
  update public.reviews
     set status = coalesce(p_status, status),
         archived = coalesce(p_archived, archived)
   where id = p_id
   returning * into row;
  if row.id is null then
    raise exception 'Review not found';
  end if;
  return row;
end;
$$;

grant execute on function public.admin_moderate_review(uuid, public.review_status, boolean) to authenticated;

create or replace function public.admin_moderate_review_image(
  p_id uuid,
  p_status public.moderation_status
) returns public.review_images
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.review_images;
begin
  if not public.has_capability('reviews.moderate') then
    raise exception 'Not allowed';
  end if;
  update public.review_images
     set status = p_status
   where id = p_id
   returning * into row;
  if row.id is null then
    raise exception 'Image not found';
  end if;
  return row;
end;
$$;

grant execute on function public.admin_moderate_review_image(uuid, public.moderation_status) to authenticated;

create or replace function public.admin_resolve_review_report(p_id uuid, p_resolved boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_capability('reviews.moderate') then
    raise exception 'Not allowed';
  end if;
  update public.review_reports set resolved = p_resolved where id = p_id;
end;
$$;

grant execute on function public.admin_resolve_review_report(uuid, boolean) to authenticated;

create or replace function public.staff_review_stats()
returns table (
  average_rating numeric,
  total_reviews integer,
  pending_reviews integer,
  reviews_this_month integer,
  reported_reviews integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    round(avg(r.rating) filter (where r.status = 'approved' and r.archived = false)::numeric, 1),
    count(*) filter (where r.archived = false)::int,
    count(*) filter (where r.status = 'pending' and r.archived = false)::int,
    count(*) filter (where r.created_at >= date_trunc('month', now()) and r.archived = false)::int,
    (select count(*)::int from public.review_reports where resolved = false)
  from public.reviews r
  where public.has_capability('reviews.moderate') or public.has_capability('analytics.read');
$$;

grant execute on function public.staff_review_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.item_requests enable row level security;
alter table public.item_request_notes enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.review_images enable row level security;
alter table public.review_reports enable row level security;

drop policy if exists "Customers insert own requests" on public.item_requests;
create policy "Customers insert own requests"
  on public.item_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Customers read own requests" on public.item_requests;
create policy "Customers read own requests"
  on public.item_requests for select
  to authenticated
  using (auth.uid() = user_id or public.has_capability('requests.write') or public.has_capability('customers.read'));

-- Internal notes: staff only. Never visible to customers.
drop policy if exists "Staff manage request notes" on public.item_request_notes;
create policy "Staff manage request notes"
  on public.item_request_notes for all
  to authenticated
  using (public.has_capability('requests.write'))
  with check (public.has_capability('requests.write'));

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id or public.is_staff());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews"
  on public.reviews for select
  using (
    (status = 'approved' and archived = false)
    or auth.uid() = user_id
    or public.has_capability('reviews.moderate')
  );

drop policy if exists "Customers insert own reviews" on public.reviews;
create policy "Customers insert own reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Customers update own reviews" on public.reviews;
create policy "Customers update own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id or public.has_capability('reviews.moderate'))
  with check (auth.uid() = user_id or public.has_capability('reviews.moderate'));

drop policy if exists "Public read approved review images" on public.review_images;
create policy "Public read approved review images"
  on public.review_images for select
  using (
    status = 'approved'
    or public.has_capability('reviews.moderate')
    or exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "Customers insert own review images" on public.review_images;
create policy "Customers insert own review images"
  on public.review_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "Staff update review images" on public.review_images;
create policy "Staff update review images"
  on public.review_images for update
  to authenticated
  using (public.has_capability('reviews.moderate'));

drop policy if exists "Customers insert review reports" on public.review_reports;
create policy "Customers insert review reports"
  on public.review_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Customers read own reports" on public.review_reports;
create policy "Customers read own reports"
  on public.review_reports for select
  to authenticated
  using (auth.uid() = reporter_id or public.has_capability('reviews.moderate'));

drop policy if exists "Staff update review reports" on public.review_reports;
create policy "Staff update review reports"
  on public.review_reports for update
  to authenticated
  using (public.has_capability('reviews.moderate'));

grant usage on type public.item_request_status to anon, authenticated;
grant usage on type public.item_request_priority to authenticated;
grant usage on type public.review_status to anon, authenticated;
grant usage on type public.moderation_status to anon, authenticated;
grant usage on type public.review_report_reason to authenticated;
grant usage on type public.notification_email_status to authenticated;
grant select (
  id, user_id, product_name, brand, category, size, color, condition_preference,
  budget_min, budget_max, budget_text, details, status, admin_response,
  linked_product_id, created_at, updated_at
) on public.item_requests to authenticated;

grant insert (
  user_id, product_name, brand, category, size, color, condition_preference,
  budget_min, budget_max, budget_text, details
) on public.item_requests to authenticated;

grant select, insert on public.item_request_notes to authenticated;

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

grant select on public.reviews to anon, authenticated;
grant insert (
  product_id, user_id, order_id, order_item_id, rating, title, body, size_purchased
) on public.reviews to authenticated;
grant update (rating, title, body, size_purchased) on public.reviews to authenticated;

grant select on public.review_images to anon, authenticated;
grant insert (review_id, storage_path) on public.review_images to authenticated;

grant select, insert on public.review_reports to authenticated;

grant select on public.product_ratings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customer review submit (bypasses brittle column grants / RLS on insert)
-- ---------------------------------------------------------------------------
create or replace function public.submit_my_review(
  p_product_id uuid,
  p_rating integer,
  p_title text,
  p_body text,
  p_order_id uuid default null,
  p_order_item_id uuid default null,
  p_size_purchased text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rid uuid;
  clean_title text := left(btrim(coalesce(p_title, '')), 120);
  clean_body text := left(btrim(coalesce(p_body, '')), 4000);
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_product_id is null then
    raise exception 'Missing product';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Choose a star rating';
  end if;
  if char_length(clean_title) < 1 then
    raise exception 'Add a review title';
  end if;
  if char_length(clean_body) < 8 then
    raise exception 'Write a little more about the product';
  end if;

  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    split_part(coalesce(auth.jwt() ->> 'email', 'customer'), '@', 1),
    'customer',
    true
  )
  on conflict (id) do nothing;

  insert into public.reviews (
    product_id, user_id, order_id, order_item_id, rating, title, body, size_purchased
  ) values (
    p_product_id,
    uid,
    p_order_id,
    p_order_item_id,
    p_rating,
    clean_title,
    clean_body,
    nullif(btrim(coalesce(p_size_purchased, '')), '')
  )
  on conflict (user_id, product_id) do update
    set rating = excluded.rating,
        title = excluded.title,
        body = excluded.body,
        size_purchased = coalesce(excluded.size_purchased, public.reviews.size_purchased),
        order_id = coalesce(excluded.order_id, public.reviews.order_id),
        order_item_id = coalesce(excluded.order_item_id, public.reviews.order_item_id),
        status = 'pending',
        updated_at = now()
  returning id into rid;

  return rid;
end;
$$;

revoke all on function public.submit_my_review(uuid, integer, text, text, uuid, uuid, text) from public, anon;
grant execute on function public.submit_my_review(uuid, integer, text, text, uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage — review photos (public URLs; DB moderation gates display)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read review images bucket" on storage.objects;
drop policy if exists "Customers upload review images" on storage.objects;
drop policy if exists "Staff manage review images" on storage.objects;
drop policy if exists "Staff delete review images" on storage.objects;

create policy "Public read review images bucket"
  on storage.objects for select
  using (bucket_id = 'review-images');

create policy "Customers upload review images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Staff manage review images"
  on storage.objects for update
  using (bucket_id = 'review-images' and public.has_capability('reviews.moderate'));

create policy "Staff delete review images"
  on storage.objects for delete
  using (bucket_id = 'review-images' and public.has_capability('reviews.moderate'));
