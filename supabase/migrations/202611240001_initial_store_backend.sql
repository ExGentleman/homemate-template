create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null check (category in ('Computers', 'Smartphones')),
  variant text not null default '',
  price numeric(12, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  image text not null default '',
  created_at timestamptz not null default now()
);

insert into public.products (id, name, slug, category, variant, price, stock, image)
values
  ('iphone-x-white', 'iPhone X', 'iphone-x', 'Smartphones', '256GB White', 299.99, 20, '/smartphones/iphone_x_1.webp'),
  ('business-laptop', 'Lenovo XPS Gaming Laptop', 'business-laptop', 'Computers', '16GB RAM', 499.99, 20, '/Laptop Sales/Lenovo (5).jpg'),
  ('student-laptop', 'Lenovo Laptop', 'student-laptop', 'Computers', '16GB RAM , 1TB ROM', 599.99, 20, '/Laptop Sales/Lenovo (20).jpg')
on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete restrict,
  items jsonb not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  payment_method text not null check (payment_method in ('ecocash', 'innbucks', 'card')),
  status text not null default 'pending_whatsapp' check (status in ('pending_whatsapp', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Profiles readable by owner and admins" on public.profiles;
create policy "Profiles readable by owner and admins"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Profiles editable by owner and admins" on public.profiles;
create policy "Profiles editable by owner and admins"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
  on public.products for select to anon, authenticated
  using (true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Orders readable by owner and admins" on public.orders;
create policy "Orders readable by owner and admins"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;

create or replace function public.create_order(
  p_order_number text,
  p_payment_method text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(12, 2) := 0;
  v_snapshot jsonb := '[]'::jsonb;
  v_order public.orders%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before placing an order.';
  end if;
  if coalesce(p_order_number, '') !~ '^HM-[0-9]{8}-[A-Z0-9]{6}$' then
    raise exception 'Invalid order reference.';
  end if;
  if p_payment_method is null or p_payment_method not in ('ecocash', 'innbucks', 'card') then
    raise exception 'Choose a supported payment method.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as submitted(value)
    group by submitted.value ->> 'product_id'
    having count(*) > 1
  ) then
    raise exception 'Each product may only appear once in the cart.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item ->> 'product_id', '') = ''
      or coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Invalid cart item.';
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product
    from public.products
    where id = v_item ->> 'product_id';

    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;
    if v_quantity > v_product.stock then
      raise exception 'Not enough stock for %.', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'variant', v_product.variant,
      'price', v_product.price,
      'quantity', v_quantity,
      'image', v_product.image
    ));
  end loop;

  insert into public.orders (order_number, user_id, items, subtotal, payment_method)
  values (p_order_number, (select auth.uid()), v_snapshot, v_subtotal, p_payment_method)
  returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.create_order(text, text, jsonb) from public, anon;
grant execute on function public.create_order(text, text, jsonb) to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
