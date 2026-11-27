import { products } from '../data/products.js'
import { escapeHtml } from '../utils/html.js'

const formatPrice = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value)

export function renderAdminDashboard(
  activeView = 'overview',
  stats = null,
  statsError = '',
  statsLoading = false,
  editingProductId = null,
  customers = null,
  customersError = '',
  customersLoading = false
) {
  const categoryCounts = products.reduce((counts, product) => {
    counts[product.category] = (counts[product.category] || 0) + 1
    return counts
  }, {})
  const productCount = products.length
  const categoryMix = ['Computers', 'Smartphones', 'Butchery Equipment', 'Kitchenware']
    .map((label) => ({
      label,
      count: categoryCounts[label] || 0,
      value: productCount ? Math.round(((categoryCounts[label] || 0) / productCount) * 100) : 0
    }))

  const currentView = ['overview', 'add-product', 'inventory', 'orders', 'analytics', 'customers', 'settings'].includes(activeView)
    ? activeView
    : 'overview'
  const viewTitles = {
    overview: 'Admin Dashboard',
    'add-product': 'Add Product',
    inventory: 'Products',
    orders: 'Orders',
    analytics: 'Analytics',
    customers: 'Customers',
    settings: 'Settings'
  }
  const lowStockProducts = products
    .filter((product) => product.stock <= 15)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4)
  const editingProduct = products.find((product) => product.id === editingProductId)
  const dashboardStats = [
    { label: 'Products in catalog', value: stats ? stats.productCount.toLocaleString() : '—', detail: 'Current database count', icon: 'products', color: 'teal' },
    { label: 'Orders placed', value: stats ? stats.orderCount.toLocaleString() : '—', detail: 'All-time saved orders', icon: 'ordersCard', color: 'blue' },
    { label: 'Customer accounts', value: stats ? stats.customerCount.toLocaleString() : '—', detail: 'Registered customers', icon: 'customersCard', color: 'purple' },
    { label: 'WhatsApp follow-up pending', value: stats ? stats.pendingOrderCount.toLocaleString() : '—', detail: 'Orders awaiting confirmation', icon: 'delivery', color: 'orange' },
    { label: 'Order value (not revenue)', value: stats ? formatPrice(stats.orderValue) : '—', detail: 'Uncancelled orders; payments are not verified here', icon: 'revenue', color: 'teal' }
  ]

  return `
    <section class="admin-shell">
      <aside class="admin-sidebar" aria-label="Admin navigation">
        <nav class="admin-side-nav">
          <p class="admin-nav-label">Management</p>
          ${adminNavItem('overview', 'Overview', 'overview', currentView)}
          ${adminNavItem('inventory', 'Products', 'products', currentView)}
          ${adminNavItem('orders', 'Orders', 'orders', currentView, stats ? `<span class="admin-nav-count">${stats.pendingOrderCount}</span>` : '')}
          ${adminNavItem('analytics', 'Analytics', 'analytics', currentView)}
          ${adminNavItem('customers', 'Customers', 'customers', currentView)}
          <p class="admin-nav-label admin-nav-system">System</p>
          ${adminNavItem('settings', 'Settings', 'settings', currentView)}
        </nav>
      </aside>

      <div class="admin-main">
        <div class="page-heading admin-heading">
          <div>
            <h1>${viewTitles[currentView]}</h1>
            <p>${currentView === 'overview' ? 'Live store activity and key performance stats.' : currentView === 'inventory' ? 'Manage your products and stock levels.' : currentView === 'add-product' ? 'Add a new item to your store catalog.' : currentView === 'customers' ? 'View customer accounts, contact details, and order activity.' : `${viewTitles[currentView]} management and store activity.`}</p>
          </div>
          ${currentView === 'overview'
            ? `<div class="admin-heading-actions"><button class="admin-refresh-button" type="button" data-refresh-admin-stats>Refresh stats</button><button class="admin-add-button" type="button" data-admin-view="add-product"><span aria-hidden="true">＋</span> Add Product</button></div>`
            : currentView === 'inventory'
              ? '<button class="admin-add-button" type="button" data-admin-view="add-product"><span aria-hidden="true">＋</span> Add Product</button>'
              : ''}
        </div>

        <section class="admin-view admin-overview-view" ${currentView !== 'overview' ? 'hidden' : ''}>
          ${statsError ? `<div class="admin-stats-error" role="alert"><p>${escapeHtml(statsError)}</p><button type="button" data-refresh-admin-stats>Try again</button></div>` : ''}
          ${statsLoading ? '<p class="admin-stats-loading" role="status">Loading verified store statistics…</p>' : ''}
          <div class="admin-stats">
            ${dashboardStats
              .map(
                (stat) => `
                  <article class="stat-card">
                    <div class="stat-copy">
                      <p>${escapeHtml(stat.label)}</p>
                      <h2>${escapeHtml(stat.value)}</h2>
                      <span class="stat-detail">${escapeHtml(stat.detail)}</span>
                    </div>
                    <span class="stat-icon ${stat.color}" aria-hidden="true">${dashboardIcon(stat.icon)}</span>
                  </article>
            `
              )
              .join('')}
          </div>

          <div class="dashboard-grid">
            <section class="panel">
              <div class="panel-header">
                <h3>Catalog categories</h3>
                <a href="/products" data-nav>View catalog</a>
              </div>
              <div class="stacked-bars">
                ${categoryMix
                  .map(
                    (item) => `
                  <div class="mix-row">
                    <div class="mix-meta">
                      <span>${item.label}</span>
                      <strong>${item.count} ${item.count === 1 ? 'product' : 'products'}</strong>
                    </div>
                    <div class="progress-track">
                      <span style="width: ${item.value}%"></span>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </section>
          </div>

          <section class="bottom-grid">
            <div class="panel">
              <div class="panel-header"><h3>Low-stock alerts</h3></div>
              <ul class="alert-list">
                ${lowStockProducts.length
                  ? lowStockProducts.map((product) => `
                    <li>
                      <div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.category)}</span></div>
                      <b>${product.stock} left</b>
                    </li>
                  `).join('')
                  : '<li><div><strong>All stocked up</strong><span>No low-stock products.</span></div></li>'}
              </ul>
            </div>
          </section>
        </section>

        <section class="admin-view panel admin-product-form-panel" ${currentView !== 'add-product' ? 'hidden' : ''}>
          <div class="panel-header">
            <div>
              <h3>Add a product</h3>
              <span>New products are saved to the Homemate catalog.</span>
            </div>
          </div>
          <form class="admin-product-form" data-admin-product-form>
            <label>Product name<input name="name" maxlength="80" placeholder="e.g. Lenovo laptop or iPhone" required /></label>
            <label>Category
              <select name="category" required>
                <option value="Computers">Computers</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Butchery Equipment">Butchery Equipment</option>
                <option value="Kitchenware">Kitchenware</option>
              </select>
            </label>
            <label class="specs-field">Specifications / description
              <textarea name="specs" maxlength="4000" rows="5" placeholder="Write a product description with its key specifications, features, condition, and what is included." required></textarea>
            </label>
            <label>Price (USD)<input name="price" type="number" min="0.01" step="0.01" placeholder="e.g. 49.99" required /></label>
            <label>Stock quantity<input name="stock" type="number" min="0" step="1" placeholder="e.g. 25" required /></label>
            <label class="image-field">
              Product images
              <span class="image-input-wrap">
                <textarea name="imageUrls" rows="3" maxlength="4000" placeholder="Paste image URLs or local paths, one per line."></textarea>
                <button class="image-upload-button" type="button" data-image-upload title="Upload picture from device" aria-label="Upload picture from device">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg>
                </button>
                <input class="visually-hidden" name="imageFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple data-image-file />
              </span>
              <small class="field-help" data-image-file-name aria-live="polite">Add multiple URLs or upload multiple JPG, PNG, or WebP images. The first image is the main product photo.</small>
            </label>
            <div class="form-submit">
              <p class="admin-form-status" data-admin-form-status aria-live="polite"></p>
              <button class="action-button primary" type="submit">Save product</button>
            </div>
          </form>
        </section>

        <section class="admin-view panel table-panel" ${currentView !== 'inventory' ? 'hidden' : ''}>
          <div class="panel-header">
            <h3>Inventory</h3>
            <span>${products.length} products tracked</span>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th><span class="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                ${products.length
                  ? products.map((product) => `
                  <tr>
                    <td>
                      <div class="product-cell">
                        <img class="mini-thumb" src="${escapeHtml(product.image)}" alt="" />
                        <div>
                          <strong>${escapeHtml(product.name)}</strong>
                        </div>
                      </div>
                    </td>
                    <td data-label="Category">${escapeHtml(product.category)}</td>
                    <td data-label="Price">${formatPrice(product.price)}</td>
                    <td data-label="Stock">${product.stock}</td>
                    <td class="inventory-actions-cell" data-label="Actions">
                      <button class="edit-product-button" type="button" data-edit-product="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.name)}" title="Edit product">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                      </button>
                      <button class="remove-product-button" type="button" data-remove-product="${escapeHtml(product.id)}" aria-label="Remove ${escapeHtml(product.name)}" title="Remove product">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')
                  : '<tr><td class="empty-inventory" colspan="5">No products in inventory.</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
        ${editingProduct ? `
          <div class="admin-modal-backdrop" data-edit-modal-backdrop>
            <section class="admin-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
              <div class="admin-edit-modal-heading">
                <div><p class="eyebrow">Product details</p><h2 id="edit-product-title">Edit product</h2></div>
                <button class="admin-modal-close" type="button" data-cancel-product-edit aria-label="Close edit form">×</button>
              </div>
              <form class="admin-product-form admin-edit-product-form" data-edit-product-form>
                <label>Product name<input name="name" maxlength="80" value="${escapeHtml(editingProduct.name)}" required /></label>
                <label>Price (USD)<input name="price" type="number" min="0.01" step="0.01" value="${editingProduct.price}" required /></label>
                <label>Stock quantity<input name="stock" type="number" min="0" step="1" value="${editingProduct.stock}" required /></label>
                <label class="specs-field">Specifications / description
                  <textarea name="specs" maxlength="4000" rows="5" required>${escapeHtml(editingProduct.specs || editingProduct.variant)}</textarea>
                </label>
                <label class="image-field">
                  Product images
                  <span class="image-input-wrap">
                    <textarea name="imageUrls" rows="4" maxlength="4000" placeholder="One image URL or local path per line." required>${escapeHtml(editingProduct.images.join('\n'))}</textarea>
                    <button class="image-upload-button" type="button" data-image-upload title="Add images from device" aria-label="Add images from device">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"/></svg>
                    </button>
                    <input class="visually-hidden" name="imageFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple data-image-file />
                  </span>
                  <small class="field-help" data-image-file-name aria-live="polite">Edit the image list or add multiple JPG, PNG, or WebP images. The first image is the main photo.</small>
                </label>
                <div class="form-submit">
                  <p class="admin-form-status" data-edit-form-status aria-live="polite"></p>
                  <div class="admin-edit-actions">
                    <button class="admin-modal-cancel" type="button" data-cancel-product-edit>Cancel</button>
                    <button class="action-button primary" type="submit">Save changes</button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        ` : ''}
        <section class="admin-view panel admin-customer-view" ${currentView !== 'customers' ? 'hidden' : ''}>
          <div class="panel-header customer-admin-header">
            <div>
              <h3>Customer directory</h3>
              <span>${customers ? `${customers.length} ${customers.length === 1 ? 'customer' : 'customers'}` : 'Customer accounts'}</span>
            </div>
            <button class="admin-refresh-button" type="button" data-refresh-admin-customers ${customersLoading ? 'disabled' : ''}>Refresh</button>
          </div>
          ${customersError ? `<div class="admin-stats-error" role="alert"><p>${escapeHtml(customersError)}</p><button type="button" data-refresh-admin-customers>Try again</button></div>` : ''}
          ${customersLoading ? '<p class="admin-stats-loading" role="status">Loading customer accounts…</p>' : ''}
          ${!customersLoading && !customersError && customers ? `
            <div class="customer-admin-summary">
              <article><span>Total customers</span><strong>${customers.length}</strong></article>
              <article><span>Individual accounts</span><strong>${customers.filter((customer) => customer.account_type !== 'business').length}</strong></article>
              <article><span>Business accounts</span><strong>${customers.filter((customer) => customer.account_type === 'business').length}</strong></article>
            </div>
            <label class="customer-admin-search">
              <span class="visually-hidden">Search customers</span>
              <input type="search" data-customer-search placeholder="Search by name, email, or contact" />
            </label>
            <div class="table-wrap customer-admin-table-wrap">
              <table class="customer-admin-table">
                <thead>
                  <tr><th>Customer</th><th>Account type</th><th>Email</th><th>Contact</th><th>Orders</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  ${customers.length ? customers.map((customer) => `
                    <tr data-customer-row data-search-text="${escapeHtml(`${customer.display_name} ${customer.email} ${customer.phone} ${customer.account_type}`.toLowerCase())}">
                      <td data-label="Customer"><strong>${escapeHtml(customer.display_name)}</strong>${customer.account_type === 'business' ? '<small>Business</small>' : ''}</td>
                      <td data-label="Account type"><span class="customer-type-pill ${customer.account_type === 'business' ? 'business' : 'individual'}">${customer.account_type === 'business' ? 'Business' : 'Individual'}</span></td>
                      <td data-label="Email"><a href="mailto:${escapeHtml(customer.email)}">${escapeHtml(customer.email)}</a></td>
                      <td data-label="Contact">${customer.phone ? `<a href="tel:${escapeHtml(customer.phone)}">${escapeHtml(customer.phone)}</a>` : '<span class="customer-no-contact">Not provided</span>'}</td>
                      <td data-label="Orders"><strong>${customer.order_count}</strong></td>
                      <td data-label="Joined">${customer.created_at ? escapeHtml(new Date(customer.created_at).toLocaleDateString()) : '—'}</td>
                    </tr>
                  `).join('') : '<tr><td class="empty-inventory" colspan="6">No customer accounts yet.</td></tr>'}
                  ${customers.length ? '<tr data-customer-no-results hidden><td class="empty-inventory" colspan="6">No customers match your search.</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          ` : ''}
        </section>
        <section class="admin-view panel admin-coming-soon" ${['orders', 'analytics', 'settings'].includes(currentView) ? '' : 'hidden'}>
          <h2>${viewTitles[currentView]}</h2>
          <p>This section is ready for its next feature pass.</p>
        </section>
      </div>
    </section>
  `
}

function adminNavItem(view, label, icon, currentView, trailing = '') {
  if (view === 'orders') {
    return `
      <a class="${currentView === view ? 'is-active' : ''}" href="/orders" data-nav>
        <span class="admin-nav-icon" aria-hidden="true">${dashboardIcon(icon)}</span>
        <span>${label}</span>
        ${trailing}
      </a>
    `
  }
  return `
    <button type="button" class="${currentView === view ? 'is-active' : ''}" data-admin-view="${view}" ${currentView === view ? 'aria-current="page"' : ''}>
      <span class="admin-nav-icon" aria-hidden="true">${dashboardIcon(icon)}</span>
      <span>${label}</span>
      ${trailing}
    </button>
  `
}

function dashboardIcon(icon) {
  const paths = {
    overview: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><rect x="14.5" y="14.5" width="6" height="6" rx="1"/>',
    products: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.7 7.5 4.4 7.5-4.4M12 12.2V21"/>',
    orders: '<rect x="4" y="4.5" width="16" height="16" rx="2"/><path d="M8 3v3M16 3v3M4 9h16M8 13h3M8 17h6"/>',
    analytics: '<path d="M4 20V12M10 20V5M16 20v-9M22 20V3"/>',
    customers: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.3a4 4 0 0 1 0 7.7M17 14.5a4 4 0 0 1 3 4V20"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.7 7.7 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a7.7 7.7 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a7.7 7.7 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a7.7 7.7 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/>',
    revenue: '<path d="M12 2v20M17 6.5C16.2 5.5 14.7 5 12.8 5 10.1 5 8 6.3 8 8.5s1.8 3.3 4.5 3.7c2.6.4 4.5 1.5 4.5 3.8s-2.1 4-5 4c-2 0-3.8-.7-5-1.9"/>',
    ordersCard: '<path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
    customersCard: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11a3.5 3.5 0 1 0 0-7"/>',
    delivery: '<path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
    trend: '<path d="m4 16 5-5 4 3 7-8M15 6h5v5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[icon] || paths.overview}</svg>`
}
