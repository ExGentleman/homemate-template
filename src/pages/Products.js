import { products } from '../data/products.js'
import { productCard } from '../components/ui/ProductCard.js'
import { escapeHtml } from '../utils/html.js'

export function renderProducts() {
  const params = new URLSearchParams(window.location.search)
  const search = params.get('search')?.trim().toLowerCase() || ''
  const selectedCategory = ['computers', 'smartphones', 'butchery-equipment'].includes(params.get('category'))
    ? params.get('category')
    : ''
  const categoryLabels = {
    computers: 'Computers',
    smartphones: 'Smartphones',
    'butchery-equipment': 'Butchery Equipment'
  }
  const visibleProducts = products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.specs || product.variant}`.toLowerCase()
    const productCategory = product.category.toLowerCase().replaceAll(' ', '-')
    const matchesCategory = !selectedCategory || productCategory === selectedCategory
    return matchesCategory && text.includes(search)
  })

  return `
    <section class="page-heading">
      <p class="eyebrow">Homemate equipment</p>
      <h1>${categoryLabels[selectedCategory] || 'Computers, Smartphones & Butchery Equipment'}</h1>
      <p>${search ? `Showing results for "${escapeHtml(search)}"` : 'Explore quality computers, smartphones, and commercial butchery equipment.'}</p>
    </section>
    <section class="section">
      <nav class="device-filters" aria-label="Filter products">
        <a class="${selectedCategory ? '' : 'is-active'}" href="/products" data-nav>All products</a>
        <a class="${selectedCategory === 'computers' ? 'is-active' : ''}" href="/products?category=computers" data-nav>Computers</a>
        <a class="${selectedCategory === 'smartphones' ? 'is-active' : ''}" href="/products?category=smartphones" data-nav>Smartphones</a>
        <a class="${selectedCategory === 'butchery-equipment' ? 'is-active' : ''}" href="/products?category=butchery-equipment" data-nav>Butchery Equipment</a>
      </nav>
      <div class="product-grid">
        ${visibleProducts.length ? visibleProducts.map(productCard).join('') : '<p class="empty-copy">No matching products found.</p>'}
      </div>
    </section>
  `
}
