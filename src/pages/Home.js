import { products } from '../data/products.js'
import { productCard } from '../components/ui/ProductCard.js'

export function renderHome() {
  const featured = products.slice(0, 3).map(productCard).join('')

  return `
    <section class="device-home">
      <div class="device-home-intro">
        <p class="eyebrow">Homemate Enterprises</p>
        <h1>We Deliver What We Promise.</h1>
        <p>Explore reliable computers, smartphones, kitchenware, and commercial butchery equipment for your business.</p>
        </div>
        <div class="device-collection-grid">
          <article class="device-collection-card">
            <a class="device-collection-hero" href="/products?category=computers" data-nav aria-label="Shop computers">
            <img src="/Laptop%20Sales/Lenovo%20%285%29.jpg" alt="Lenovo laptop" fetchpriority="high" />
          </a>
          <div class="device-collection-copy">
            <div>
              <p class="device-collection-kicker">Work. Study. Create.</p>
              <h2>Computers</h2>
              <p>Find a laptop to power your next big idea, wherever the day takes you.</p>
            </div>
            <a class="device-collection-button" href="/products?category=computers" data-nav>Shop computers <span aria-hidden="true">→</span></a>
          </div>
        </article>

        <article class="device-collection-card device-collection-card-dark">
          <a class="device-collection-hero" href="/products?category=smartphones" data-nav aria-label="Shop smartphones">
            <img src="/smartphones/iphone_x_1.webp" alt="iPhone X" loading="lazy" />
          </a>
          <div class="device-collection-copy">
            <div>
              <p class="device-collection-kicker">Stay close. Go further.</p>
              <h2>Smartphones</h2>
              <p>Stay connected with phones for the moments, messages, and plans that matter.</p>
            </div>
            <a class="device-collection-button" href="/products?category=smartphones" data-nav>Shop smartphones <span aria-hidden="true">→</span></a>
          </div>
        </article>

        <article class="device-collection-card">
          <a class="device-collection-hero" href="/products?category=kitchenware" data-nav aria-label="Shop kitchenware">
            <img src="/assets/homemate-symbol.png" alt="Homemate kitchenware" loading="lazy" />
          </a>
          <div class="device-collection-copy">
            <div>
              <p class="device-collection-kicker">Cook. Store. Serve.</p>
              <h2>Kitchenware</h2>
              <p>Shop practical cookware and kitchen essentials for homes and businesses.</p>
            </div>
            <a class="device-collection-button" href="/products?category=kitchenware" data-nav>Shop kitchenware <span aria-hidden="true">→</span></a>
          </div>
        </article>
      </div>
    </section>

  `
}
