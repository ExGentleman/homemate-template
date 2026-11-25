create or replace function public.admin_dashboard_stats()
returns table (
  product_count bigint,
  order_count bigint,
  customer_count bigint,
  pending_order_count bigint,
  order_value numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Administrator access is required.';
  end if;

  return query
  select
    (select count(*) from public.products),
    (select count(*) from public.orders),
    (select count(*) from public.profiles where role = 'customer'),
    (select count(*) from public.orders where status = 'pending_whatsapp'),
    coalesce((select sum(subtotal) from public.orders where status <> 'cancelled'), 0);
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
