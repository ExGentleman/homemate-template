export function renderFooter() {
  return `

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></link>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand-group">
          <a class="footer-brand" href="/" data-nav aria-label="Homemate home">
            <span class="homemate-mark" aria-hidden="true">
              <img src="/assets/homemate-symbol.png" alt="" />
            </span>
            <span class="homemate-copy">
              <span class="homemate-name">HOMEMATE</span>
              <span class="homemate-tagline">WE DELIVER WHAT WE PROMISE</span>
            </span>
          </a>
          <span class="footer-copyright">&copy; 2026 Homemate&trade;</span>
        </div>

        <div class="footer-care">
            <span>Contact Us</span>
            <a href="tel:+263775072639">+263 775 072 639</a>
            <a href="tel:+263788704849">+263 788 704 849</a>
          </div>

        <div class="social-links" aria-label="Social handles">
            <a href="https://facebook.com/homemate%20kitchenware" title="Facebook" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="https://instagram.com/homematee" title="Instagram" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://x.com/homematee" title="X" aria-label="X" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="https://tiktok.com/@homematee" title="TikTok" aria-label="TikTok" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-tiktok"></i></a>
            <a href="https://wa.me/263775072639" title="WhatsApp" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-whatsapp"></i></a>
          </div>
      </div>
</footer>
  `
}
