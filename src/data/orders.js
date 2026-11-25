import { requireSupabase } from '../lib/supabase.js'
import { authStore } from '../stores/authStore.js'

export async function createOrder({ orderNumber, paymentMethod, items }) {
  const { data, error } = await requireSupabase().rpc('create_order', {
    p_order_number: orderNumber,
    p_payment_method: paymentMethod,
    p_items: items.map(({ product, quantity }) => ({
      product_id: product.id,
      quantity
    }))
  })

  if (error) throw new Error(`Unable to save your order: ${error.message}`)
  if (!data) throw new Error('The order was not saved. Please try again.')
  return data
}

export async function listOrders() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('orders')
    .select('user_id, order_number, items, subtotal, payment_method, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Unable to load order history: ${error.message}`)
  if (authStore.user?.role !== 'admin' || data.length === 0) return data

  const userIds = [...new Set(data.map((order) => order.user_id))]
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, phone, account_type, business_name')
    .in('id', userIds)
  if (profilesError) throw new Error(`Unable to load order customer details: ${profilesError.message}`)

  const profilesById = new Map(profiles.map((profile) => [
    profile.id,
    {
      ...profile,
      display_name: profile.account_type === 'business' && profile.business_name
        ? profile.business_name
        : `${profile.first_name} ${profile.last_name}`.trim()
    }
  ]))
  return data.map((order) => ({ ...order, customer: profilesById.get(order.user_id) || null }))
}
