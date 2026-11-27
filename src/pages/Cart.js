import { cartStore } from '../stores/cartStore.js'
import { escapeHtml } from '../utils/html.js'

const money = (value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

export function renderCart() {
  const items = cartStore.getDetailedItems()
  const itemCount = cartStore.getItemCount()

  if (!items.length) {
    return `
      <section class="empty-state">
        <h1>Your Cart is Empty</h1>
        <p>Looks like you have not added anything to your cart yet.</p>
        <a class="primary-action" href="/products" data-nav>Go shopping</a>
      </section>
    `
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const total = subtotal

  return `
    <section class="cart-page">
      <div class="cart-header">
        <h1>Shopping Cart <span>${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span></h1>
      </div>

      <div class="cart-grid">
        <div class="cart-items">
          ${items.map(({ product, quantity }) => `
            <article class="cart-row">
              <a class="cart-thumb" href="/products/${escapeHtml(product.slug)}" data-nav>
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
              </a>
              <div class="cart-details">
                <a href="/products/${escapeHtml(product.slug)}" data-nav>${escapeHtml(product.name)}</a>
                <p>${money(product.price)} each</p>
              </div>
              <div class="qty-control">
                <button data-id="${escapeHtml(product.id)}" data-qty="${quantity - 1}" ${quantity <= 1 ? 'disabled' : ''}>-</button>
                <span>${quantity}</span>
                <button data-id="${escapeHtml(product.id)}" data-qty="${quantity + 1}" ${quantity >= product.stock ? 'disabled' : ''}>+</button>
              </div>
              <strong>${money(product.price * quantity)}</strong>
              <button class="remove-button" type="button" title="Remove item" aria-label="Remove ${escapeHtml(product.name)} from cart" data-remove="${escapeHtml(product.id)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>
              </button>
            </article>
          `).join('')}
        </div>

        <aside class="summary-card">
          <h2>Order Summary</h2>
          <div class="summary-lines">
            <p><span>Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span><strong>${money(subtotal)}</strong></p>
            <p><span>Shipping</span><strong class="free">Free</strong></p>
            <hr />
            <p class="summary-total"><span>Total</span><strong>${money(total)}</strong></p>
          </div>
          <button class="checkout-button">Proceed to Checkout</button>
          <form class="checkout-methods" data-checkout-form hidden>
            <h3>Choose payment method</h3>
            <p>Your order details will open in WhatsApp. We’ll confirm payment instructions with you there.</p>
            <div class="payment-options" role="radiogroup" aria-label="Payment method">
              <label class="payment-option">
                <input type="radio" name="paymentMethod" value="ecocash" />
                <span class="payment-mark ecocash-mark">E</span>
                <span><strong>EcoCash</strong><small>Pay with your EcoCash wallet</small></span>
              </label>
              <label class="payment-option">
                <input type="radio" name="paymentMethod" value="innbucks" />
                <span class="payment-mark innbucks-mark">I</span>
                <span><strong>InnBucks</strong><small>Pay with your InnBucks wallet</small></span>
              </label>
              <label class="payment-option">
                <input type="radio" name="paymentMethod" value="card" />
                <span class="payment-mark card-mark">▰</span>
                <span><strong>Bank card</strong><small>Visa or Mastercard</small></span>
              </label>
            </div>
            <button class="checkout-continue" type="submit" disabled>Send order on WhatsApp</button>
            <p class="checkout-status" data-checkout-status role="status" aria-live="polite"></p>
          </form>
          <a class="continue-link" href="/products" data-nav>Continue shopping</a>
        </aside>
      </div>
    </section>
  `
}
