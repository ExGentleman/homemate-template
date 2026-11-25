import { requireSupabase } from '../lib/supabase.js'

export async function listCustomers() {
  const client = requireSupabase()
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, account_type, business_name, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (profilesError) throw new Error(`Unable to load customers: ${profilesError.message}`)
  if (!profiles.length) return []

  const { data: orders, error: ordersError } = await client
    .from('orders')
    .select('user_id')

  if (ordersError) throw new Error(`Unable to load customer order counts: ${ordersError.message}`)

  const orderCounts = new Map()
  for (const order of orders) {
    orderCounts.set(order.user_id, (orderCounts.get(order.user_id) || 0) + 1)
  }

  return profiles.map((profile) => ({
    ...profile,
    account_type: profile.account_type || 'individual',
    business_name: profile.business_name || '',
    display_name: profile.account_type === 'business' && profile.business_name
      ? profile.business_name
      : `${profile.first_name} ${profile.last_name}`.trim() || 'Customer',
    order_count: orderCounts.get(profile.id) || 0
  }))
}
