import { escapeHtml } from '../../utils/html.js'

const money = (value) => `$${value.toLocaleString()}`

export function productCard(product) {
  const id = escapeHtml(product.id)
  const slug = escapeHtml(product.slug)
  const name = escapeHtml(product.name)
  const category = escapeHtml(product.category)
  const specs = escapeHtml(product.specs || product.variant)
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image]
  const image = escapeHtml(images[0] || product.image)

  return `
    <article class="product-card">

      <a href="/products/${slug}" data-nav>
        <img src="${image}" alt="${name}" data-product-carousel="${id}" />
      </a>
      <div class="product-card-body">
        <p>${category}</p>
        <a href="/products/${slug}" data-nav><h3>${name}</h3></a>
        <p class="product-card-specs">${specs}</p>
        <div class="product-card-footer">
          <strong>${money(product.price)}</strong>
          <button data-add-product="${id}">Add</button>
        </div>
      </div>
    </article>
  `
}

function heartIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>'
}

function heartFilledIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="false"><path d="M12 21 4.2 13.4l-1-1A5.5 5.5 0 0 1 11 4.6l1 1.1 1-1.1a5.5 5.5 0 0 1 7.8 7.8l-1 1L12 21Z"/></svg>'
}
