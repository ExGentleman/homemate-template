alter table public.profiles
  add column if not exists account_type text not null default 'individual',
  add column if not exists business_name text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_account_type_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_type_check
      check (account_type in ('individual', 'business'));
  end if;
end;
$$;

grant update (account_type, business_name) on public.profiles to authenticated;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_type text;
begin
  v_account_type := case
    when new.raw_user_meta_data ->> 'account_type' = 'business' then 'business'
    else 'individual'
  end;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    email,
    phone,
    account_type,
    business_name
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    v_account_type,
    case
      when v_account_type = 'business' then coalesce(new.raw_user_meta_data ->> 'business_name', '')
      else ''
    end
  );
  return new;
end;
$$;
