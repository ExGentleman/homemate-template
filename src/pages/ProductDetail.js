import { products } from '../data/products.js'
import { wishlistStore } from '../stores/wishlistStore.js'
import { escapeHtml } from '../utils/html.js'

const money = (value) => `$${value.toLocaleString()}`

export function renderProductDetail(slug) {
  const variants = products.filter((product) => product.slug === slug)
  const product = variants[0]

  if (!product) {
    return `
      <section class="empty-state">
        <h1>Product not found</h1>
        <p>That product is no longer available.</p>
        <a class="primary-action" href="/products" data-nav>Back to shop</a>
      </section>
    `
  }

  const prices = variants.map((item) => item.price)
  const priceLabel = prices.length > 1
    ? `${money(Math.min(...prices))} - ${money(Math.max(...prices))}`
    : money(product.price)
  const name = escapeHtml(product.name)
  const images = product.images?.length ? product.images : [product.image]
  const specs = product.specs || product.variant || ''

  return `
    <section class="product-detail">
      <div class="detail-media">
        <img data-main-product-image src="${escapeHtml(images[0])}" alt="${name}" />
        ${images.length > 1 ? `
          <div class="product-gallery-thumbnails" aria-label="More product images">
            ${images.map((image, index) => `
              <button class="product-gallery-thumbnail ${index === 0 ? 'is-selected' : ''}" type="button" data-gallery-image="${escapeHtml(image)}" data-gallery-alt="${name} photo ${index + 1}" aria-label="Show product photo ${index + 1}" aria-pressed="${index === 0}">
                <img src="${escapeHtml(image)}" alt="" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(product.category)}</p>
        <h1>${name}</h1>
        <p class="detail-price">${priceLabel}</p>
        ${specs ? `<p class="detail-description">${escapeHtml(specs)}</p>` : ''}
        <div class="variant-list">
          ${variants.map((variant) => `
            <article class="variant-card">
              <div>
                <h3>Availability</h3>
                <p>${variant.stock} in stock</p>
              </div>
              <strong>${money(variant.price)}</strong>
              
              <div class="variant-actions">
                <button data-add-product="${escapeHtml(variant.id)}">Add to cart</button>
                <button class="like-button ${wishlistStore.hasProduct(variant.id) ? 'is-liked' : ''}" data-toggle-wishlist="${escapeHtml(variant.id)}" title="Like ${name}" aria-label="Like ${name}">
                  ${wishlistStore.hasProduct(variant.id) ? heartFilledIcon() : heartIcon()}
                </button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `
}

function heartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>'
}

function heartFilledIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 4.2 13.4l-1-1A5.5 5.5 0 0 1 11 4.6l1 1.1 1-1.1a5.5 5.5 0 0 1 7.8 7.8l-1 1L12 21Z"/></svg>'
}
