import { requireSupabase } from '../lib/supabase.js'

export async function fetchAdminStats() {
  const { data, error } = await requireSupabase().rpc('admin_dashboard_stats')

  if (error) {
    throw new Error(`Unable to load accurate dashboard statistics: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Supabase did not return dashboard statistics.')
  }

  return {
    productCount: Number(row.product_count),
    orderCount: Number(row.order_count),
    customerCount: Number(row.customer_count),
    pendingOrderCount: Number(row.pending_order_count),
    orderValue: Number(row.order_value)
  }
}
