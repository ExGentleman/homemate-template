import { authStore } from '../../stores/authStore.js'
import { cartStore } from '../../stores/cartStore.js'
import { wishlistStore } from '../../stores/wishlistStore.js'
import { escapeHtml } from '../../utils/html.js'

export function renderNavbar() {
  const user = authStore.user
  const itemCount = cartStore.getItemCount()
  const wishlistCount = wishlistStore.getDetailedItems().length

  return `
    <header class="fashion-header">
      <div class="fashion-header-inner">
        <a class="fashion-brand" href="/" data-nav aria-label="Homemate home">
          ${homemateBrand()}
        </a>

        <nav class="fashion-links" aria-label="Main navigation">
          <a href="/" data-nav>Home</a>
          <a href="/products?category=computers" data-nav>Computers</a>
          <a href="/products?category=smartphones" data-nav>Smartphones</a>
          <a href="/products?category=butchery-equipment" data-nav>Butchery Equipment</a>
          <a href="/about-us" data-nav>About Us</a>

        </nav>

        <div class="fashion-actions">
          <button class="fashion-icon-link search-toggle" type="button" data-search-toggle title="Search" aria-label="Search" aria-expanded="false">
            ${searchIcon()}
          </button>

          <form class="search-form fashion-search-form" data-search-form>
            <input name="search" type="search" placeholder="Search products" />
            <button type="submit" title="Search" aria-label="Search">${searchIcon()}</button>
          </form>

          <a class="fashion-icon-link" href="/wishlist" data-nav title="Wishlist" aria-label="Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}">
            ${heartIcon()}
            ${wishlistCount ? `<span class="fashion-badge">${wishlistCount}</span>` : ''}
          </a>

          <a class="fashion-icon-link" href="/cart" data-nav title="Shopping bag" aria-label="Shopping bag${itemCount ? `, ${itemCount} items` : ''}">
            ${bagIcon()}
            ${itemCount ? `<span class="fashion-badge">${itemCount}</span>` : ''}
          </a>

          ${user ? `
            <div class="user-menu fashion-user-menu">
              <button class="fashion-icon-link" type="button" title="Account menu" aria-label="Account menu" aria-haspopup="true">${userIcon()}</button>
              <div class="dropdown" aria-label="Account options">
                <p class="dropdown-user">
                  <strong>${escapeHtml(user.displayName || `${user.firstName} ${user.lastName}`.trim())}</strong>
                  <small>${user.role === 'admin' ? 'Administrator' : user.accountType === 'business' ? 'Business account' : 'Individual account'}</small>
                </p>
                ${user.role === 'customer' ? '<a href="/dashboard" data-nav>Customer Dashboard</a>' : ''}
                <a href="/wishlist" data-nav>Liked Items</a>
                <a href="/orders" data-nav>My Orders</a>
                ${user.role === 'admin' ? '<a href="/admin" data-nav>Admin Dashboard</a>' : ''}
                <button class="dropdown-logout" type="button" data-logout>Sign out</button>
              </div>
            </div>
          ` : '<a class="fashion-login-link" href="/login" data-nav>Login</a>'}

          <a class="fashion-shop-button" href="/products" data-nav>SHOP NOW</a>
        </div>
      </div>
    </header>
  `
}

function homemateBrand() {
  return `
    <span class="homemate-mark" aria-hidden="true">
      <img src="/assets/homemate-symbol.png" alt="homemate logo" />
    </span>
    <span class="homemate-copy">
      <span class="homemate-name">HOMEMATE</span>
      <span class="homemate-tagline">WE DELIVER WHAT WE PROMISE</span>
    </span>
  `
}

function searchIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/></svg>'
}

function heartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>'
}

function cartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.1 2.1h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4H5.1"/></svg>'
}

function bagIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
}

function userIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>'
}
