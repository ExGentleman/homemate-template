import { findProduct } from '../data/products.js'

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem('clickbuy-wishlist')) || []
  } catch {
    return []
  }
}

function saveItems(items) {
  localStorage.setItem('clickbuy-wishlist', JSON.stringify(items))
}

export const wishlistStore = {
  items: loadItems(),
  hasProduct(id) {
    return this.items.includes(id)
  },
  toggleProduct(id) {
    this.items = this.hasProduct(id)
      ? this.items.filter((itemId) => itemId !== id)
      : [...this.items, id]
    saveItems(this.items)
  },
  getDetailedItems() {
    return this.items
      .map((id) => findProduct(id))
      .filter(Boolean)
  }
}
