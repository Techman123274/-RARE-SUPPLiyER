-- Paste THIS ENTIRE FILE into the Supabase SQL Editor and click Run.
-- Do not run only the last line. The old trigger will block a partial run.

-- 1. Take the old trigger offline so this update can succeed.
drop trigger if exists profiles_protect_privileges on public.profiles;

-- 2. Owner emails are always restored to admin on sign-in.
create table if not exists public.store_owner_emails (
  email text primary key
);

insert into public.store_owner_emails (email)
values ('runtzdiscord1@gmail.com')
on conflict (email) do nothing;

alter table public.store_owner_emails enable row level security;

-- 3. Promote the owner account directly, even if another admin row exists.
update public.profiles p
   set role = 'admin',
       is_active = true
  from auth.users u
 where p.id = u.id
   and lower(u.email) in (select o.email from public.store_owner_emails o);

insert into public.profiles (id, email, display_name, role, is_active)
select u.id,
       lower(u.email),
       split_part(u.email, '@', 1),
       'admin',
       true
  from auth.users u
  join public.store_owner_emails o on o.email = lower(u.email)
 where not exists (select 1 from public.profiles p where p.id = u.id);

-- 4. Install the updated guard. Role changes stay blocked for normal users.
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
    if current_setting('app.allow_role_change', true) = 'on' then
      return new;
    end if;

    privileged :=
      current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'dashboard_user')
      or session_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'dashboard_user');

    if privileged then
      return new;
    end if;

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

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

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

-- 5. Confirm it worked.
select p.id, u.email, p.role, p.is_active
  from public.profiles p
  join auth.users u on u.id = p.id
 where lower(u.email) in (select o.email from public.store_owner_emails o);
