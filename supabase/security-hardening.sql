-- Optional hardening. Run after schema.sql.
-- Customers can update display name only. Role changes go through admin_set_profile_role.

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

revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, email) on public.profiles to authenticated;
