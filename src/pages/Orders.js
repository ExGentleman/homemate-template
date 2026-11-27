import { authStore } from '../stores/authStore.js'
import { escapeHtml } from '../utils/html.js'

const money = (value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export function renderOrders(orders) {
  if (!authStore.user) {
    return `
      <section class="empty-state">
        <h1>Sign in to view orders</h1>
        <p>Your order history is available after you sign in.</p>
        <a class="primary-action" href="/login" data-nav>Sign in</a>
      </section>
    `
  }

  return `
    <section class="orders-page">
      <header class="orders-heading">
        <div>
          <p class="eyebrow">${authStore.user.role === 'admin' ? 'Store management' : 'Your account'}</p>
          <h1>${authStore.user.role === 'admin' ? 'Customer Orders' : 'My Orders'}</h1>
          <p>${orders.length ? 'Order references and WhatsApp handoff details.' : 'Orders you place will appear here.'}</p>
        </div>
        <a class="customer-dashboard-shop" href="/products" data-nav>Shop devices</a>
      </header>

      ${orders.length ? `
        <div class="orders-list">
          ${orders.map((order) => `
            <article class="order-card">
              <header>
                <div>
                  <span class="order-label">Order reference</span>
                  <h2>${escapeHtml(order.order_number)}</h2>
                </div>
                <span class="order-status">${escapeHtml(order.status.replaceAll('_', ' '))}</span>
              </header>
              <p class="order-date">${escapeHtml(new Date(order.created_at).toLocaleString())} · ${escapeHtml(order.payment_method)}</p>
              ${order.customer ? `<p class="order-customer">${escapeHtml(order.customer.display_name)}${order.customer.account_type === 'business' ? ` · Contact: ${escapeHtml(order.customer.phone)}` : ''} · ${escapeHtml(order.customer.email)}</p>` : ''}
              <ul>
                ${order.items.map((item) => `
                  <li>
                    <span>${escapeHtml(String(item.quantity))} × ${escapeHtml(item.name)}</span>
                    <strong>${money(Number(item.price) * Number(item.quantity))}</strong>
                  </li>
                `).join('')}
              </ul>
              <footer><span>Total · shipping free</span><strong>${money(order.subtotal)}</strong></footer>
              ${authStore.user.role === 'customer' && order.status === 'pending_whatsapp' ? `
                <div class="order-cancel-actions">
                  <button type="button" class="order-cancel-button" data-cancel-order="${escapeHtml(order.order_number)}">Cancel order</button>
                  <p data-order-cancel-status role="status" aria-live="polite"></p>
                </div>
              ` : ''}
            </article>
          `).join('')}
        </div>
      ` : `
        <section class="empty-state">
          <h2>No orders yet</h2>
          <p>When you place an order, its reference and details will be saved here.</p>
          <a class="primary-action" href="/products" data-nav>Browse devices</a>
        </section>
      `}
    </section>
  `
}
