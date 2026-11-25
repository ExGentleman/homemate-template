import { wishlistStore } from '../stores/wishlistStore.js'
import { productCard } from '../components/ui/ProductCard.js'

export function renderWishlist() {
  const liked = wishlistStore.getDetailedItems()

  if (!liked.length) {
    return `
      <section class="empty-state">
        <h1>Liked Items</h1>
        <p>Your liked products will appear here when you tap the heart on an item.</p>
        <a class="primary-action" href="/products" data-nav>Find products</a>
      </section>
    `
  }

  return `
    <section class="page-heading">
      <p class="eyebrow">Wishlist</p>
      <h1>Liked Items</h1>
      <p>Everything you have saved for later.</p>
    </section>
    <section class="section">
      <div class="product-grid">${liked.map(productCard).join('')}</div>
    </section>
  `
}
