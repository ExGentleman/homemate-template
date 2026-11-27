create or replace function public.cancel_order(p_order_number text)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before cancelling an order.';
  end if;

  select * into v_order
  from public.orders
  where order_number = p_order_number
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'This order is not available to your account.';
  end if;
  if v_order.status <> 'pending_whatsapp' then
    raise exception 'Only orders awaiting WhatsApp confirmation can be cancelled.';
  end if;

  update public.orders
  set status = 'cancelled'
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.cancel_order(text) from public, anon;
grant execute on function public.cancel_order(text) to authenticated;
