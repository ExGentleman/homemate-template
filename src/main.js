import { renderLayout } from './components/layout/Layout.js'
import { renderHome } from './pages/Home.js'
import { renderProducts } from './pages/Products.js'
import { renderCart } from './pages/Cart.js'
import { renderPlaceholder } from './pages/Placeholder.js'
import { renderProductDetail } from './pages/ProductDetail.js'
import { renderWishlist } from './pages/Wishlist.js'
import { renderAuth, renderProfile } from './pages/Auth.js'
import { renderAdminDashboard } from './pages/AdminDashboard.js'
import { renderCustomerDashboard } from './pages/CustomerDashboard.js'
import { renderOrders } from './pages/Orders.js'
import { renderAbout } from './pages/About.js'
import { addProduct, initializeProducts, products, removeProduct, updateProduct } from './data/products.js'
import { listCustomers } from './data/customers.js'
import { fetchAdminStats } from './data/adminStats.js'
import { createOrder, listOrders } from './data/orders.js'
import { cartStore } from './stores/cartStore.js'
import { wishlistStore } from './stores/wishlistStore.js'
import { authStore } from './stores/authStore.js'
import { isSupabaseConfigured } from './lib/supabase.js'

let activeAdminView = 'overview'
let adminStats = null
let adminStatsError = ''
let adminStatsLoading = false
let editingProductId = null
let adminCustomers = null
let adminCustomersError = ''
let adminCustomersLoading = false
let lastMobileScrollY = 0
let mobileNavbarScrollFrame = null

const routes = {
  '/': renderHome,
  '/products': renderProducts,
  '/cart': renderCart,
  '/wishlist': renderWishlist,
  '/profile': renderProfile,
  '/dashboard': renderCustomerDashboard,
  '/about-us': renderAbout,
  '/orders': () => renderPlaceholder('Loading orders'),
  '/admin': () => authStore.user?.role === 'admin'
    ? renderAdminDashboard(
      activeAdminView,
      adminStats,
      adminStatsError,
      adminStatsLoading,
      editingProductId,
      adminCustomers,
      adminCustomersError,
      adminCustomersLoading
    )
    : renderPlaceholder('Admin access required'),
  '/login': renderAuth
}

function getRoute() {
  const path = window.location.pathname
  if (path.startsWith('/products/')) {
    return () => renderProductDetail(decodeURIComponent(path.replace('/products/', '')))
  }
  return routes[path] || renderHome
}

export function navigate(path) {
  if (path === '/admin') {
    activeAdminView = 'overview'
    editingProductId = null
    adminStats = null
    adminStatsError = ''
  }
  window.history.pushState({}, '', path)
  renderApp()
}

export function renderApp() {
  const app = document.querySelector('#app')
  const isHome = window.location.pathname === '/'
  app.innerHTML = renderLayout(getRoute()(), {
    admin: window.location.pathname === '/admin',
    deviceHome: isHome
  })
  setupMobileNavbarAutoHide()
  document.title = isHome
    ? 'Homemate™ | Business, Kitchenware & Butchery Equipment'
    : 'Homemate™ | Computers, Kitchenware & Butchery Equipment'
  bindLayoutEvents()
  bindPageEvents()
  if (
    window.location.pathname === '/admin' &&
    activeAdminView === 'overview' &&
    !adminStats &&
    !adminStatsError
  ) {
    loadAdminDashboardStats()
  }
  if (
    window.location.pathname === '/admin' &&
    activeAdminView === 'customers' &&
    !adminCustomers &&
    !adminCustomersError
  ) {
    loadAdminCustomers()
  }
  if (window.location.pathname === '/orders') loadOrdersPage()
}

function setupMobileNavbarAutoHide() {
  if (typeof window === 'undefined') return

  const app = document.querySelector('#app')
  const header = document.querySelector('.fashion-header')
  if (!app || !header) return

  header.classList.remove('is-nav-hidden')
  lastMobileScrollY = window.scrollY

  if (window.mobileNavbarScrollBound) return
  window.mobileNavbarScrollBound = true

  window.addEventListener('scroll', () => {
    if (mobileNavbarScrollFrame !== null) return

    mobileNavbarScrollFrame = window.requestAnimationFrame(() => {
      mobileNavbarScrollFrame = null
      const isMobile = window.matchMedia('(max-width: 560px)').matches
      const isHome = window.location.pathname === '/'
      const currentScrollY = Math.max(window.scrollY, 0)
      const header = document.querySelector('.fashion-header')

      if (!isMobile || isHome || !header) {
        header?.classList.remove('is-nav-hidden')
      } else if (currentScrollY <= 10) {
        header.classList.remove('is-nav-hidden')
      } else if (currentScrollY > lastMobileScrollY + 6) {
        header.classList.add('is-nav-hidden')
      } else if (currentScrollY < lastMobileScrollY - 6) {
        header.classList.remove('is-nav-hidden')
      }

      lastMobileScrollY = currentScrollY
    })
  }, { passive: true })
}

async function loadAdminDashboardStats() {
  if (adminStatsLoading || window.location.pathname !== '/admin' || activeAdminView !== 'overview') return

  adminStatsLoading = true
  renderApp()
  try {
    adminStats = await fetchAdminStats()
    adminStatsError = ''
  } catch (error) {
    adminStats = null
    adminStatsError = error instanceof Error ? error.message : 'Unable to load dashboard statistics.'
  } finally {
    adminStatsLoading = false
    if (window.location.pathname === '/admin' && activeAdminView === 'overview') renderApp()
  }
}

async function loadAdminCustomers() {
  if (adminCustomersLoading || window.location.pathname !== '/admin' || activeAdminView !== 'customers') return

  adminCustomersLoading = true
  renderApp()
  try {
    adminCustomers = await listCustomers()
    adminCustomersError = ''
  } catch (error) {
    adminCustomers = null
    adminCustomersError = error instanceof Error ? error.message : 'Unable to load customers.'
  } finally {
    adminCustomersLoading = false
    if (window.location.pathname === '/admin' && activeAdminView === 'customers') renderApp()
  }
}

async function loadOrdersPage() {
  const main = document.querySelector('#app main')
  if (!main) return

  try {
    const orders = authStore.user ? await listOrders() : []
    if (window.location.pathname !== '/orders') return
    main.innerHTML = renderOrders(orders)
    bindLayoutEvents()
  } catch (error) {
    if (window.location.pathname !== '/orders') return
    main.innerHTML = '<section class="empty-state"><h1>Unable to load orders</h1><p data-orders-error></p></section>'
    main.querySelector('[data-orders-error]').textContent =
      error instanceof Error ? error.message : 'Please try again.'
  }
}

function bindLayoutEvents() {
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      navigate(link.getAttribute('href'))
    })
  })

  const searchForm = document.querySelector('[data-search-form]')
  const searchToggle = document.querySelector('[data-search-toggle]')
  if (searchToggle && searchForm) {
    searchToggle.addEventListener('click', () => {
      const isOpen = searchForm.classList.toggle('is-open')
      searchToggle.innerHTML = isOpen
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/></svg>'
      searchToggle.setAttribute('aria-expanded', String(isOpen))
      searchToggle.setAttribute('aria-label', isOpen ? 'Close search' : 'Search')
      searchToggle.title = isOpen ? 'Close search' : 'Search'
      if (isOpen) {
        searchForm.querySelector('input')?.focus()
      }
    })
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault()
      const query = new FormData(searchForm).get('search')?.toString().trim()
      if (query) navigate(`/products?search=${encodeURIComponent(query)}`)
    })
  }
}

function bindPageEvents() {
  const checkoutButton = document.querySelector('.checkout-button')
  const checkoutForm = document.querySelector('[data-checkout-form]')
  if (checkoutButton && checkoutForm) {
    checkoutButton.addEventListener('click', () => {
      checkoutForm.hidden = false
      checkoutForm.querySelector('input')?.focus()
      checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    checkoutForm.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
      input.addEventListener('change', () => {
        if (checkoutForm.dataset.orderCreated === 'true') return
        checkoutForm.querySelector('.checkout-continue').disabled = false
        checkoutForm.querySelector('[data-checkout-status]').textContent = ''
      })
    })

    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const status = checkoutForm.querySelector('[data-checkout-status]')
      const submitButton = checkoutForm.querySelector('.checkout-continue')
      const selectedMethod = new FormData(checkoutForm).get('paymentMethod')?.toString()
      const methodNames = {
        ecocash: 'EcoCash',
        innbucks: 'InnBucks',
        card: 'bank card'
      }
      const paymentName = methodNames[selectedMethod]
      if (!paymentName) {
        status.textContent = 'Choose a payment method to continue.'
        return
      }

      if (!authStore.user) {
        status.replaceChildren(
          document.createTextNode('Sign in before placing an order so we can save your order reference. '),
          Object.assign(document.createElement('a'), {
            href: '/login',
            textContent: 'Sign in'
          })
        )
        return
      }

      const items = cartStore.getDetailedItems()
      if (!items.length) {
        status.textContent = 'Your cart is empty. Add an item before sending an order.'
        return
      }

      const formatMoney = (value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      const customerName = authStore.user.accountType === 'business'
        ? `${authStore.user.businessName} (business contact: ${authStore.user.phone})`
        : `${authStore.user.firstName} ${authStore.user.lastName}`
      const now = new Date()
      const dateCode = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('')
      const orderNumber = `HM-${dateCode}-${crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()}`
      const whatsappWindow = window.open('about:blank', '_blank')
      if (whatsappWindow) {
        whatsappWindow.opener = null
      }
      submitButton.disabled = true
      status.textContent = 'Saving your order securely...'

      try {
        const order = await createOrder({
          orderNumber,
          paymentMethod: selectedMethod,
          items
        })
        const orderLines = order.items.map((item) =>
          `• ${item.quantity} × ${item.name}${item.variant ? ` (${item.variant})` : ''} — ${formatMoney(Number(item.price) * item.quantity)}`
        )
        const message = [
          'Hello Homemate! I’d like to place an order:',
          `Order reference: ${order.order_number}`,
          '',
          `Customer: ${customerName}`,
          '',
          ...orderLines,
          '',
          `Subtotal: ${formatMoney(Number(order.subtotal))}`,
          'Shipping: Free',
          `Total: ${formatMoney(Number(order.subtotal))}`,
          `Preferred payment method: ${paymentName}`,
          '',
          'Please confirm availability and send me the payment instructions. I will share payment confirmation here.'
        ].join('\n')
        const whatsappUrl = `https://wa.me/263775072639?text=${encodeURIComponent(message)}`

        if (whatsappWindow) {
          whatsappWindow.location.href = whatsappUrl
          status.textContent = `Order ${order.order_number} is saved. Review the message in WhatsApp and press Send.`
        } else {
          status.replaceChildren(
            document.createTextNode(`Order ${order.order_number} is saved. `),
            Object.assign(document.createElement('a'), {
              href: whatsappUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              textContent: 'Open your order in WhatsApp'
            })
          )
        }
        checkoutForm.dataset.orderCreated = 'true'
        submitButton.textContent = 'Order saved'
      } catch (error) {
        if (whatsappWindow) whatsappWindow.close()
        status.textContent = error instanceof Error ? error.message : 'Unable to save your order.'
        submitButton.disabled = false
      }
    })
  }

  document.querySelectorAll('[data-admin-view]').forEach((button) => {
    button.addEventListener('click', () => {
      editingProductId = null
      activeAdminView = button.dataset.adminView
      renderApp()
    })
  })

  document.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => {
      editingProductId = button.dataset.editProduct
      renderApp()
      document.querySelector('[data-edit-product-form] [name="name"]')?.focus()
    })
  })

  document.querySelectorAll('[data-cancel-product-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      editingProductId = null
      renderApp()
    })
  })

  const editProductForm = document.querySelector('[data-edit-product-form]')
  if (editProductForm) {
    const imageFileInput = editProductForm.querySelector('[data-image-file]')
    const imageFileName = editProductForm.querySelector('[data-image-file-name]')
    editProductForm.querySelector('[data-image-upload]')?.addEventListener('click', () => {
      imageFileInput?.click()
    })
    imageFileInput?.addEventListener('change', () => {
      const files = [...(imageFileInput.files || [])]
      imageFileName.textContent = files.length
        ? `${files.length} additional image${files.length === 1 ? '' : 's'} selected: ${files.map((file) => file.name).join(', ')}`
        : 'Edit the image list or add multiple JPG, PNG, or WebP images. The first image is the main photo.'
    })

    editProductForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const status = editProductForm.querySelector('[data-edit-form-status]')
      const submitButton = editProductForm.querySelector('[type="submit"]')
      const data = new FormData(editProductForm)
      const imageFiles = data.getAll('imageFiles').filter((file) => file instanceof File && file.size > 0)

      status.textContent = ''
      submitButton.disabled = true
      submitButton.textContent = 'Saving...'
      try {
        const images = [
          ...(data.get('imageUrls')?.toString() || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
          ...await Promise.all(imageFiles.map(prepareProductImage))
        ]
        await updateProduct(editingProductId, {
          name: data.get('name')?.toString() || '',
          specs: data.get('specs')?.toString() || '',
          price: data.get('price')?.toString() || '',
          stock: data.get('stock')?.toString() || '',
          images
        })
        editingProductId = null
        adminStats = null
        adminStatsError = ''
        renderApp()
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'Unable to update product.'
        submitButton.disabled = false
        submitButton.textContent = 'Save changes'
      }
    })
  }

  document.querySelectorAll('[data-refresh-admin-stats]').forEach((button) => {
    button.addEventListener('click', () => {
      adminStats = null
      adminStatsError = ''
      renderApp()
    })
  })

  document.querySelectorAll('[data-refresh-admin-customers]').forEach((button) => {
    button.addEventListener('click', () => {
      if (adminCustomersLoading) return
      adminCustomers = null
      adminCustomersError = ''
      loadAdminCustomers()
    })
  })

  document.querySelector('[data-customer-search]')?.addEventListener('input', (event) => {
    const query = event.currentTarget.value.trim().toLowerCase()
    const rows = [...document.querySelectorAll('[data-customer-row]')]
    let visibleCount = 0
    for (const row of rows) {
      const matches = row.dataset.searchText.includes(query)
      row.hidden = !matches
      if (matches) visibleCount += 1
    }
    const noResults = document.querySelector('[data-customer-no-results]')
    if (noResults) noResults.hidden = visibleCount > 0
  })

  const productForm = document.querySelector('[data-admin-product-form]')
  if (productForm) {
    const imageFileInput = productForm.querySelector('[data-image-file]')
    const imageFileName = productForm.querySelector('[data-image-file-name]')
    productForm.querySelector('[data-image-upload]')?.addEventListener('click', () => {
      imageFileInput?.click()
    })
    imageFileInput?.addEventListener('change', () => {
      const files = [...(imageFileInput.files || [])]
      imageFileName.textContent = files.length
        ? `${files.length} image${files.length === 1 ? '' : 's'} selected: ${files.map((file) => file.name).join(', ')}`
        : 'Add multiple URLs or local paths, or upload multiple JPG, PNG, or WebP images.'
    })

    productForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const status = productForm.querySelector('[data-admin-form-status]')
      const submitButton = productForm.querySelector('[type="submit"]')
      const data = new FormData(productForm)
      const imageFiles = data.getAll('imageFiles').filter((file) => file instanceof File && file.size > 0)

      status.textContent = ''
      submitButton.disabled = true
      submitButton.textContent = 'Saving...'
      try {
        const imageUrls = data.get('imageUrls')?.toString() || ''
        const images = [
          ...imageUrls.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
          ...await Promise.all(imageFiles.map(prepareProductImage))
        ]
        await addProduct({
          name: data.get('name')?.toString() || '',
          category: data.get('category')?.toString() || '',
          specs: data.get('specs')?.toString() || '',
          price: data.get('price')?.toString() || '',
          stock: data.get('stock')?.toString() || '',
          images
        })
        activeAdminView = 'inventory'
        adminStats = null
        adminStatsError = ''
        renderApp()
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'Unable to add product.'
        submitButton.disabled = false
        submitButton.textContent = 'Save product'
      }
    })
  }

  document.querySelectorAll('[data-remove-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (authStore.user?.role !== 'admin') return
      const id = button.dataset.removeProduct
      const product = products.find((item) => item.id === id)
      if (!product || !window.confirm(`Remove "${product.name}" from the catalog?`)) return
      button.disabled = true
      try {
        if (!await removeProduct(id)) return
        if (editingProductId === id) editingProductId = null
        cartStore.removeItem(id)
        if (wishlistStore.hasProduct(id)) wishlistStore.toggleProduct(id)
        adminStats = null
        adminStatsError = ''
        renderApp()
      } catch (error) {
        button.disabled = false
        window.alert(error instanceof Error ? error.message : 'Unable to remove product.')
      }
    })
  })

  document.querySelectorAll('[data-toggle-wishlist]').forEach((button) => {
    button.addEventListener('click', () => {
      wishlistStore.toggleProduct(button.dataset.toggleWishlist)
      renderApp()
    })
  })

  document.querySelectorAll('[data-gallery-image]').forEach((button) => {
    button.addEventListener('click', () => {
      const mainImage = document.querySelector('[data-main-product-image]')
      if (!mainImage) return
      mainImage.src = button.dataset.galleryImage
      mainImage.alt = button.dataset.galleryAlt || ''
      document.querySelectorAll('[data-gallery-image]').forEach((thumbnail) => {
        const selected = thumbnail === button
        thumbnail.classList.toggle('is-selected', selected)
        thumbnail.setAttribute('aria-pressed', String(selected))
      })
    })
  })

  document.querySelectorAll('[data-add-product]').forEach((button) => {
    button.addEventListener('click', () => {
      cartStore.addProduct(button.dataset.addProduct)
      renderApp()
    })
  })

  document.querySelectorAll('[data-qty]').forEach((button) => {
    button.addEventListener('click', () => {
      cartStore.updateQuantity(button.dataset.id, Number(button.dataset.qty))
      renderApp()
    })
  })

  document.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      cartStore.removeItem(button.dataset.remove)
      renderApp()
    })
  })

  // ...existing code...
  const authForm = document.querySelector('[data-auth-form]')
  if (authForm) {
    const signupFields = authForm.querySelectorAll('[data-signup-fields]')
    const status = authForm.querySelector('[data-auth-status]')
    const title = authForm.querySelector('[data-auth-title]')
    const submitButton = authForm.querySelector('[data-auth-submit]')
    const toggleButton = authForm.querySelector('[data-auth-toggle]')
    const accountTypeInput = authForm.querySelector('[data-account-type]')

    const updateSignupAccountFields = () => {
      const isSignup = authForm.dataset.mode === 'signup'
      const isBusiness = accountTypeInput?.value === 'business'
      const businessFields = authForm.querySelector('[data-business-fields]')
      const businessNameInput = businessFields?.querySelector('input')
      const individualFields = authForm.querySelector('[data-individual-fields]')
      if (businessFields) businessFields.hidden = !isBusiness
      if (businessNameInput) {
        businessNameInput.disabled = !isBusiness || !isSignup
        businessNameInput.required = isBusiness && isSignup
      }
      if (individualFields) individualFields.hidden = isBusiness
      individualFields?.querySelectorAll('input').forEach((input) => {
        input.disabled = isBusiness || !isSignup
        input.required = !isBusiness && isSignup
      })
      authForm.querySelector('[data-email-label]').textContent = isBusiness && isSignup ? 'Business email' : 'Email'
      authForm.querySelector('[data-phone-label]').textContent = isBusiness ? 'Business contact' : 'Contact number'
      const phoneInput = authForm.querySelector('[name="phone"]')
      if (phoneInput) {
        phoneInput.disabled = !isSignup
        phoneInput.required = isSignup
      }
      const confirmPassword = authForm.querySelector('[name="confirmPassword"]')
      if (confirmPassword) confirmPassword.required = isSignup
    }

    accountTypeInput?.addEventListener('change', updateSignupAccountFields)

    toggleButton.addEventListener('click', () => {
      const isSignup = authForm.dataset.mode !== 'signup'
      authForm.dataset.mode = isSignup ? 'signup' : 'login'
      title.textContent = isSignup ? 'Create an account' : 'Sign in'
      submitButton.textContent = isSignup ? 'Create account' : 'Sign in'
      toggleButton.textContent = isSignup ? 'Sign in instead' : 'Create an account'
      status.textContent = ''

      signupFields.forEach((group) => {
        group.hidden = !isSignup
        group.querySelectorAll('input, select').forEach((input) => {
          input.disabled = !isSignup
          input.required = isSignup && input.name === 'accountType'
        })
      })
      updateSignupAccountFields()
      authForm.querySelector('[name="password"]').autocomplete = isSignup ? 'new-password' : 'current-password'
    })

    authForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      status.textContent = ''
      status.classList.remove('is-success')

      const invalidInput = [...authForm.elements].find((input) =>
        !input.disabled &&
        !input.closest('[hidden]') &&
        !input.validity.valid
      )
      if (invalidInput) {
        if (invalidInput?.type === 'email') {
          status.textContent = 'Enter a valid email address.'
        } else if (invalidInput?.validity.valueMissing) {
          const label = invalidInput.closest('label')?.querySelector('span')?.textContent ||
            invalidInput.closest('label')?.childNodes[0]?.textContent?.trim() ||
            invalidInput.name
          status.textContent = `Complete the ${label.toLowerCase()} field.`
        } else if (invalidInput?.validity.tooShort) {
          status.textContent = `${invalidInput.name === 'password' ? 'Password' : 'Confirm password'} must be at least 8 characters.`
        } else {
          status.textContent = invalidInput?.validationMessage || 'Check the highlighted field and try again.'
        }
        invalidInput?.focus()
        return
      }

      const data = new FormData(authForm)
      const password = String(data.get('password') || '')
      const isSignup = authForm.dataset.mode === 'signup'
      submitButton.disabled = true
      toggleButton.disabled = true
      status.textContent = isSignup ? 'Creating your account...' : 'Signing you in...'

      try {
        if (isSignup) {
          if (password !== data.get('confirmPassword')) {
            throw new Error('Passwords do not match.')
          }

          const user = await authStore.signup({
            accountType: String(data.get('accountType') || 'individual'),
            businessName: String(data.get('businessName') || ''),
            firstName: String(data.get('firstName') || ''),
            lastName: String(data.get('lastName') || ''),
            email: String(data.get('email') || ''),
            phone: String(data.get('phone') || ''),
            password
          })
          if (user) {
            navigate('/dashboard')
          } else {
            status.classList.add('is-success')
            status.textContent = 'Account created. Check your email to confirm your address, then sign in.'
          }
        } else {
          const user = await authStore.login(
            String(data.get('email') || ''),
            password
          )
          navigate(user.role === 'admin' ? '/admin' : '/dashboard')
        }
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'Unable to continue.'
      } finally {
        if (authForm.isConnected) {
          submitButton.disabled = false
          toggleButton.disabled = false
        }
      }
    })
  }

// ...existing code...

  const profileForm = document.querySelector('[data-profile-form]')
  if (profileForm) {
    const profileAccountType = profileForm.querySelector('[data-profile-account-type]')
    const profileBusinessFields = profileForm.querySelector('[data-profile-business-fields]')
    const profileBusinessName = profileBusinessFields?.querySelector('input')
    const profileIndividualFields = [...profileForm.querySelectorAll('[data-profile-individual-fields]')]
    const updateProfileAccountFields = () => {
      const isBusiness = profileAccountType?.value === 'business'
      if (profileBusinessFields) profileBusinessFields.hidden = !isBusiness
      if (profileBusinessName) {
        profileBusinessName.disabled = !isBusiness
        profileBusinessName.required = isBusiness
      }
      profileIndividualFields.forEach((field) => {
        field.hidden = isBusiness
        const input = field.querySelector('input')
        if (input) {
          input.disabled = isBusiness
          input.required = !isBusiness
        }
      })
      profileForm.querySelector('[data-profile-email-label]').textContent = isBusiness ? 'Business email' : 'Email'
      profileForm.querySelector('[data-profile-phone-label]').textContent = isBusiness ? 'Business contact' : 'Contact number'
    }
    profileAccountType?.addEventListener('change', updateProfileAccountFields)

    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const data = new FormData(profileForm)
      const status = profileForm.querySelector('[data-profile-status]')
      try {
        const result = await authStore.updateProfile({
          accountType: data.get('accountType')?.toString() || 'individual',
          businessName: data.get('businessName')?.toString() || '',
          firstName: data.get('firstName')?.toString() || '',
          lastName: data.get('lastName')?.toString() || '',
          email: data.get('email')?.toString() || '',
          phone: data.get('phone')?.toString() || ''
        })
        renderApp()
        const savedStatus = document.querySelector('[data-profile-status]')
        savedStatus.classList.add('is-success')
        savedStatus.textContent = result.emailChangePending
          ? 'Profile saved. Confirm the email change using the link we sent you.'
          : 'Profile saved.'
      } catch (error) {
        status.classList.remove('is-success')
        status.textContent = error instanceof Error ? error.message : 'Unable to save profile.'
      }
    })
  }

  const passwordForm = document.querySelector('[data-password-form]')
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const data = new FormData(passwordForm)
      const status = passwordForm.querySelector('[data-password-status]')
      const submitButton = passwordForm.querySelector('[type="submit"]')
      const newPassword = data.get('newPassword')?.toString() || ''
      if (newPassword !== data.get('confirmPassword')?.toString()) {
        status.classList.remove('is-success')
        status.textContent = 'New passwords do not match.'
        return
      }

      status.textContent = ''
      submitButton.disabled = true
      try {
        await authStore.updatePassword({ newPassword })
        passwordForm.reset()
        status.classList.add('is-success')
        status.textContent = 'Password updated.'
      } catch (error) {
        status.classList.remove('is-success')
        status.textContent = error instanceof Error ? error.message : 'Unable to update password.'
      } finally {
        submitButton.disabled = false
      }
    })
  }

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true
      try {
        await authStore.logout()
        navigate('/')
      } catch (error) {
        button.disabled = false
        window.alert(error instanceof Error ? error.message : 'Unable to sign out.')
      }
    })
  })
}

async function prepareProductImage(file) {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('The image must be 10 MB or smaller.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not process this image.')

    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const compressedImage = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Your browser could not compress this image.')),
        'image/jpeg',
        0.8
      )
    })
    if (compressedImage.size > 1.5 * 1024 * 1024) {
      throw new Error('This image is too large to upload. Choose a smaller picture.')
    }
    return await blobToDataUrl(compressedImage)
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Unable to read this image. Choose another file.')
  } finally {
    bitmap?.close()
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Unable to read this image. Choose another file.'))
    })
    reader.addEventListener('error', () => reject(new Error('Unable to read this image. Choose another file.')))
    reader.readAsDataURL(blob)
  })
}

function showBackendError(title, message) {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <main class="backend-setup">
      <section>
        <p class="eyebrow">Homemate setup</p>
        <h1>${title}</h1>
        <p data-backend-message></p>
      </section>
    </main>
  `
  app.querySelector('[data-backend-message]').textContent = message
}

async function startApp() {
  if (!isSupabaseConfigured) {
    showBackendError(
      'Connect your Supabase project',
      'Copy .env.example to .env.local, add your Supabase project URL and publishable key, then restart the development server. See README.md for database setup.'
    )
    return
  }

  try {
    await authStore.initialize()
    await initializeProducts()
    renderApp()
  } catch (error) {
    showBackendError(
      'Unable to connect to the store backend',
      error instanceof Error ? error.message : 'Check your Supabase project settings and try again.'
    )
  }
}

window.addEventListener('popstate', renderApp)
window.addEventListener('auth-state-changed', renderApp)
startApp()
