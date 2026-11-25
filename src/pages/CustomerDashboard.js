import { authStore } from '../stores/authStore.js'
import { cartStore } from '../stores/cartStore.js'
import { wishlistStore } from '../stores/wishlistStore.js'
import { escapeHtml } from '../utils/html.js'

export function renderCustomerDashboard() {
  const user = authStore.user
  if (!user || user.role !== 'customer') {
    return `
      <section class="empty-state">
        <h1>Sign in to view your dashboard</h1>
        <p>Your account shortcuts will be available after you sign in.</p>
        <a class="primary-action" href="/login" data-nav>Sign in</a>
      </section>
    `
  }

  const wishlistCount = wishlistStore.getDetailedItems().length
  const cartCount = cartStore.getItemCount()
  const displayName = user.displayName || `${user.firstName} ${user.lastName}`.trim()
  const welcomeName = user.accountType === 'business'
    ? user.businessName
    : user.firstName || displayName
  const accountType = user.accountType === 'business' ? 'Business account' : 'Individual account'

  return `
    <section class="admin-shell customer-dashboard-shell">
      <aside class="admin-sidebar" aria-label="Customer navigation">
        <nav class="admin-side-nav">
          <p class="admin-nav-label">My account</p>
          <a class="is-active" href="/dashboard" data-nav><span class="admin-nav-icon">${dashboardIcon('overview')}</span><span>Overview</span></a>
          <a href="/orders" data-nav><span class="admin-nav-icon">${dashboardIcon('orders')}</span><span>My orders</span></a>
          <a href="/wishlist" data-nav><span class="admin-nav-icon">${dashboardIcon('wishlist')}</span><span>Saved items</span></a>
          <a href="/profile" data-nav><span class="admin-nav-icon">${dashboardIcon('profile')}</span><span>Profile</span></a>
        </nav>
      </aside>

      <div class="admin-main">
        <div class="page-heading admin-heading">
          <div>
            <h1>Customer Dashboard</h1>
            <p>Welcome back, ${escapeHtml(welcomeName)}. Here’s your Homemate account at a glance.</p>
          </div>
          <a class="admin-add-button customer-dashboard-shop" href="/products" data-nav>Shop products</a>
        </div>

        <div class="admin-stats customer-dashboard-stats">

          <a class="stat-card customer-stat-card" href="/profile" data-nav>
            <div class="stat-copy">
              <p>Account type</p>
              <h2>${escapeHtml(displayName)}</h2>
              <span class="stat-detail">${escapeHtml(accountType)}</span>
            </div>
            <span class="stat-icon blue" aria-hidden="true">${dashboardIcon('profile')}</span>
          </a>
          <a class="stat-card customer-stat-card" href="/cart" data-nav>
            <div class="stat-copy">
              <p>Items in your bag</p>
              <h2>${cartCount}</h2>
              <span class="stat-detail">Review your cart</span>
            </div>
            <span class="stat-icon teal" aria-hidden="true">${dashboardIcon('cart')}</span>
          </a>
          <a class="stat-card customer-stat-card" href="/wishlist" data-nav>
            <div class="stat-copy">
              <p>Liked items</p>
              <h2>${wishlistCount}</h2>
              <span class="stat-detail">View your wishlist</span>
            </div>
            <span class="stat-icon purple" aria-hidden="true">${dashboardIcon('wishlist')}</span>
          </a>
          
        </div>

        <div class="dashboard-grid customer-dashboard-panels">
          <section class="panel">
            <div class="panel-header">
              <h3>Shopping activity</h3>
              <a href="/products" data-nav>Continue shopping</a>
            </div>
            <div class="customer-dashboard-actions">
              <a href="/cart" data-nav>
                <span class="customer-action-icon teal">${dashboardIcon('cart')}</span>
                <span><strong>Your shopping bag</strong><small>${cartCount ? `${cartCount} ${cartCount === 1 ? 'item' : 'items'} ready for checkout` : 'Your bag is currently empty'}</small></span>
                <span class="customer-action-arrow" aria-hidden="true">→</span>
              </a>
              <a href="/wishlist" data-nav>
                <span class="customer-action-icon purple">${dashboardIcon('wishlist')}</span>
                <span><strong>Saved products</strong><small>${wishlistCount ? `${wishlistCount} ${wishlistCount === 1 ? 'product' : 'products'} saved for later` : 'Products you like appear here'}</small></span>
                <span class="customer-action-arrow" aria-hidden="true">→</span>
              </a>
              <a href="/orders" data-nav>
                <span class="customer-action-icon blue">${dashboardIcon('orders')}</span>
                <span><strong>Order history</strong><small>View order references and status</small></span>
                <span class="customer-action-arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </section>

          <section class="panel customer-account-panel">
            <div class="panel-header">
              <h3>Account overview</h3>
              <a href="/profile" data-nav>Edit profile</a>
            </div>
            <div class="customer-account-summary">
              <span class="customer-profile-mark" aria-hidden="true">${escapeHtml(displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase())}</span>
              <div>
                <strong>${escapeHtml(displayName)}</strong>
                <span>${escapeHtml(accountType)}</span>
              </div>
            </div>
            <dl class="customer-account-details">
              <div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
              <div><dt>Contact</dt><dd>${escapeHtml(user.phone || 'Add a contact number')}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  `
}

function dashboardIcon(name) {
  const paths = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    orders: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    wishlist: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    profile: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    shop: '<path d="M3 9h18l-1.5-5h-15L3 9ZM5 9v11h14V9M9 20v-6h6v6"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.1 2.1h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4H5.1"/>'
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}
