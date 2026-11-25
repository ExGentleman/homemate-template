import { findProduct } from '../data/products.js'

const initialItems = []

function loadItems() {
  try {
    const savedItems = JSON.parse(localStorage.getItem('masaire-cart'))
    if (!Array.isArray(savedItems)) return initialItems
    return savedItems.filter((item) =>
      item &&
      typeof item.id === 'string' &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    )
  } catch {
    return initialItems
  }
}

function saveItems(items) {
  localStorage.setItem('masaire-cart', JSON.stringify(items))
}

export const cartStore = {
  items: loadItems(),
  getDetailedItems() {
    return this.items
      .map((item) => ({ ...item, product: findProduct(item.id) }))
      .filter((item) => item.product)
  },
  getItemCount() {
    return this.getDetailedItems().reduce((sum, item) => sum + item.quantity, 0)
  },
  addProduct(id) {
    const product = findProduct(id)
    if (!product) return

    const existing = this.items.find((item) => item.id === id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + 1, product.stock)
    } else {
      this.items.push({ id, quantity: 1 })
    }

    saveItems(this.items)
  },
  updateQuantity(id, quantity) {
    const product = findProduct(id)
    if (!product) return

    const nextQuantity = Math.max(1, Math.min(quantity, product.stock))
    this.items = this.items.map((item) => item.id === id ? { ...item, quantity: nextQuantity } : item)
    saveItems(this.items)
  },
  removeItem(id) {
    this.items = this.items.filter((item) => item.id !== id)
    saveItems(this.items)
  }
}
