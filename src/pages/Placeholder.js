export function renderPlaceholder(title) {
  return `
    <section class="empty-state">
      <h1>${title}</h1>
      <p>This screen is ready for the next feature pass.</p>
      <a class="primary-action" href="/products" data-nav>Back to shop</a>
    </section>
  `
}
