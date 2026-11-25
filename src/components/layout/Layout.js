import { renderNavbar } from './Navbar.js'
import { renderFooter } from './Footer.js'

export function renderLayout(content, { admin = false, deviceHome = false } = {}) {
  return `
    <div class="app ${admin ? 'is-admin-page' : ''} ${deviceHome ? 'is-device-home' : ''}">
      ${renderNavbar()}
      <main>${content}</main>
      ${renderFooter()}
    </div>
  `
}
