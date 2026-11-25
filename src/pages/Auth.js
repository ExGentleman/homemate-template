import { authStore } from '../stores/authStore.js'
import { escapeHtml } from '../utils/html.js'

export function renderAuth() {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <p class="eyebrow">Accounts</p>
        <h3>Welcome to HOMEMATE</h3>

        <form class="auth-form" data-auth-form data-mode="login" novalidate>
          <h2 data-auth-title>Sign in</h2>

          <div class="auth-signup-fields" data-signup-fields hidden>
            <label>Account type
              <select name="accountType" data-account-type disabled required>
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label data-business-fields hidden>Business name
              <input name="businessName" autocomplete="organization" maxlength="120" disabled />
            </label>
            <div class="auth-signup-fields" data-individual-fields hidden>
              <label>First name
              <input name="firstName" autocomplete="given-name" maxlength="60" disabled />
              </label>
              <label>Last name
              <input name="lastName" autocomplete="family-name" maxlength="60" disabled />
              </label>
            </div>
          </div>

          <label><span data-email-label>Email</span>
            <input name="email" type="email" autocomplete="email" placeholder="you@example.com" required />
          </label>
          <label>Password
            <input name="password" type="password" autocomplete="current-password" placeholder="Enter your password" minlength="8" required />
          </label>

          <div class="auth-signup-fields" data-signup-fields hidden>
            <label><span data-phone-label>Contact number</span>
              <input name="phone" type="tel" autocomplete="tel" maxlength="30" disabled />
            </label>
            <label>Confirm password
              <input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" disabled />
            </label>
          </div>

          <p class="form-message" data-auth-status role="status" aria-live="polite"></p>
          <button type="submit" data-auth-submit>Sign in</button>
          <button type="button" data-auth-toggle>Create an account</button>
        </form>
      </div>
    </section>
  `
}

export function renderProfile() {
  const user = authStore.user
  if (!user) {
    return `
      <section class="empty-state">
        <h1>Sign in to view your profile</h1>
        <p>Your account details and settings will appear here after you sign in.</p>
        <a class="primary-action" href="/login" data-nav>Sign in</a>
      </section>
    `
  }

  const fullName = user.displayName || `${user.firstName} ${user.lastName}`.trim()
  const initials = (user.accountType === 'business' ? user.businessName : `${user.firstName} ${user.lastName}`)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')

  return `
    <section class="profile-page">
      <header class="profile-heading">
        <div>
          <p class="eyebrow">Account</p>
          <h1>My Profile</h1>
          <p>Manage your customer or business details and account security.</p>
        </div>
        <span class="profile-role">${user.role === 'admin' ? 'Administrator' : 'Customer'}</span>
      </header>

      <div class="profile-grid">
        <section class="profile-card">
          <div class="profile-card-heading">
            <span class="profile-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
            <div>
              <h2>${escapeHtml(fullName)}</h2>
              <p>${escapeHtml(user.email)}</p>
            </div>
          </div>

          <form class="profile-form" data-profile-form>
            <h3>Personal information</h3>
            <label>Account type
              <select name="accountType" data-profile-account-type>
                <option value="individual" ${user.accountType !== 'business' ? 'selected' : ''}>Individual</option>
                <option value="business" ${user.accountType === 'business' ? 'selected' : ''}>Business</option>
              </select>
            </label>
            <label data-profile-business-fields ${user.accountType !== 'business' ? 'hidden' : ''}>Business name
              <input name="businessName" autocomplete="organization" maxlength="120" value="${escapeHtml(user.businessName || '')}" ${user.accountType === 'business' ? 'required' : 'disabled'} />
            </label>
            <label data-profile-individual-fields ${user.accountType === 'business' ? 'hidden' : ''}>First name
              <input name="firstName" autocomplete="given-name" maxlength="60" value="${escapeHtml(user.firstName)}" ${user.accountType !== 'business' ? 'required' : 'disabled'} />
            </label>
            <label data-profile-individual-fields ${user.accountType === 'business' ? 'hidden' : ''}>Last name
              <input name="lastName" autocomplete="family-name" maxlength="60" value="${escapeHtml(user.lastName)}" ${user.accountType !== 'business' ? 'required' : 'disabled'} />
            </label>
            <label><span data-profile-email-label>${user.accountType === 'business' ? 'Business email' : 'Email'}</span>
              <input name="email" type="email" autocomplete="email" value="${escapeHtml(user.email)}" required />
            </label>
            <label><span data-profile-phone-label>${user.accountType === 'business' ? 'Business contact' : 'Contact number'}</span>
              <input name="phone" type="tel" autocomplete="tel" maxlength="30" value="${escapeHtml(user.phone || '')}" required />
            </label>
            <p class="form-message" data-profile-status role="status" aria-live="polite"></p>
            <button type="submit">Save changes</button>
          </form>

          <nav class="profile-links" aria-label="Account links">
            ${user.role === 'customer' ? '<a href="/dashboard" data-nav>Customer dashboard</a>' : ''}
            <a href="/wishlist" data-nav>Liked items</a>
            <a href="/orders" data-nav>My orders</a>
            ${user.role === 'admin' ? '<a href="/admin" data-nav>Admin dashboard</a>' : ''}
          </nav>
        </section>

        <section class="profile-card">
          <div class="profile-card-heading">
            <div>
              <h2>Account security</h2>
              <p>Choose a password you have not used elsewhere.</p>
            </div>
          </div>
          <form class="profile-form" data-password-form>
            <label>New password
              <input name="newPassword" type="password" autocomplete="new-password" minlength="8" required />
            </label>
            <label>Confirm new password
              <input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required />
            </label>
            <p class="password-note">Use at least 8 characters.</p>
            <p class="form-message" data-password-status role="status" aria-live="polite"></p>
            <button type="submit">Update password</button>
          </form>
        </section>
      </div>
    </section>
  `
}