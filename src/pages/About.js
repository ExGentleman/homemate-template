export function renderAbout() {
  const computerProducts = [
    'Desktop Computers & Laptops',
    'Monitors, Keyboards & Mice',
    'Printers, Scanners & Toners',
    'Computer Accessories & Cables',
    'Servers, Networking & UPS / Power Backups',
    'Software & Office Setup'
  ]
  const butcheryProducts = [
    'Meat Mincers / Grinders',
    'Meat Slicers',
    'Meat Saws / Bandsaws',
    'Sausage Fillers',
    'Meat Mixers & Bowl Cutters',
    'Butchery Display Fridges / Meat Chillers',
    'Weighing Scales & Meat Trays',
    'Butchery Knives, Blocks & Tools'
  ]
  const reasons = [
    ['Quality Guaranteed', 'We stock durable, tested equipment.'],
    ['Affordable Prices', 'Best value for businesses of all sizes.'],
    ['Delivery', 'Fast delivery around Harare and nationwide.'],
    ['After-Sales Support', 'Installation, training, and repairs.'],
    ['Expert Advice', 'We help you choose the right equipment for your budget.']
  ]

  return `
    <article class="about-page">
      <header class="about-hero">
        <p class="eyebrow">About Homemate</p>
        <h1>Equipment for businesses building what’s next.</h1>
        <p>Homemate is a trusted supplier of quality computers and commercial butchery equipment in Zimbabwe.</p>
        <p>We help businesses, schools, offices, and butcheries work smarter with reliable equipment, fair prices, and after-sales support you can depend on.</p>
        <p>Whether you are setting up a new office, upgrading your IT, or opening a butchery, Homemate is your one-stop partner.</p>
      </header>

      <section class="about-principles" aria-label="Our mission and vision">
        <article class="about-panel">
          <p class="eyebrow">Our Mission</p>
          <h2>Helping customers grow</h2>
          <p>To provide affordable, durable, and modern equipment that helps our customers grow their businesses and serve their customers better.</p>
        </article>
        <article class="about-panel">
          <p class="eyebrow">Our Vision</p>
          <h2>Zimbabwe’s trusted supplier</h2>
          <p>To become Zimbabwe's most trusted supplier for computers and butchery equipment — known for quality, honesty, and excellent service.</p>
        </article>
      </section>

      <section class="about-section">
        <header>
          <p class="eyebrow">What We Sell</p>
          <h2>Equipment for work and trade</h2>
        </header>
        <div class="about-product-groups">
          <article class="about-panel">
            <h3>1. Computers &amp; IT Equipment</h3>
            <ul>${computerProducts.map((item) => `<li>${item}</li>`).join('')}</ul>
            <a href="/products?category=computers" data-nav>Explore computers <span aria-hidden="true">→</span></a>
          </article>
          <article class="about-panel">
            <h3>2. Butchery Equipment</h3>
            <ul>${butcheryProducts.map((item) => `<li>${item}</li>`).join('')}</ul>
            <a href="/products?category=butchery-equipment" data-nav>Explore butchery equipment <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </section>

      <section class="about-section about-reasons">
        <header>
          <p class="eyebrow">Why Choose Homemate?</p>
          <h2>More than equipment</h2>
        </header>
        <ul class="about-reasons-grid">
          ${reasons.map(([title, detail]) => `
            <li class="about-panel">
              <h3>${title}</h3>
              <p>${detail}</p>
            </li>
          `).join('')}
        </ul>
      </section>

      <section class="about-promise">
        <p class="eyebrow">Our Promise</p>
        <h2>Your business is our business.</h2>
        <p>At Homemate, we don't just sell equipment — we build long-term relationships. Your business is our business.</p>
      </section>
    </article>
  `
}
