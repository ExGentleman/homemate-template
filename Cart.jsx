import React from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

const Cart = () => {
  const { user } = useAuthStore()
  const { items, updateQuantity, removeItem, item_count } = useCartStore()

  // ─── Financial Calculations ─────────────────────────────────
  // Computes subtotal dynamically based on your product/variant structure
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const base = parseFloat(item.product.sale_price ?? item.product.base_price)
      const modifier = item.variant ? parseFloat(item.variant.price_modifier) : 0
      return sum + (base + modifier) * item.quantity
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const vat = subtotal * 0.15
  const total = subtotal + vat

  // ─── Core Handlers ──────────────────────────────────────────
  const handleQtyChange = (itemId, currentQty, increment, maxStock) => {
    const newQty = currentQty + increment
    if (newQty >= 1 && newQty <= maxStock) {
      updateQuantity(itemId, newQty)
    }
  }

  if (items.length === 0) {
    return (
      <main>
        <div style={{ minHeight: 'calc(-64px + 100vh)', background: '#f8f9fa', padding: '4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' }}>Your Cart is Empty</h2>
            <p style={{ color: '#888', marginBottom: '2rem' }}>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" style={{ display: 'inline-block', background: '#e94560', color: '#fff', padding: '0.85rem 2rem', borderRadius: '10px', fontWeight: 600 }}>
              Go Shopping
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div style={styles.pageWrapper}>
        <div style={styles.mainContainer}>
          
          {/* Header Title */}
          <h1 style={styles.headerTitle}>
            Shopping Cart
            <span style={styles.itemCountText}>{item_count} {item_count === 1 ? 'item' : 'items'}</span>
          </h1>

          {/* Grid Layout */}
          <div style={styles.cartGrid}>
            
            {/* 1. Items Column */}
            <div style={styles.itemsColumn}>
              {items.map((item) => {
                const basePrice = parseFloat(item.product.sale_price ?? item.product.base_price)
                const modifier = item.variant ? parseFloat(item.variant.price_modifier) : 0
                const unitPrice = basePrice + modifier
                const rowTotal = unitPrice * item.quantity

                // Dynamic stock discovery matching QuickAddModal criteria
                const stock = item.variant
                  ? (item.variant.inventory?.[0]?.quantity - item.variant.inventory?.[0]?.reserved ?? 0)
                  : (item.product.inventory?.reduce((sum, i) => sum + (i.quantity - i.reserved), 0) ?? 0)

                return (
                  <div key={item.id} style={styles.cartRow}>
                    {/* Thumbnail */}
                    <Link to={`/products/${item.product.slug}`}>
                      <div style={styles.imgWrapper}>
                        <img 
                          alt={item.product.name} 
                          src={item.product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c'} 
                          style={styles.img}
                        />
                      </div>
                    </Link>

                    {/* Metadata Details */}
                    <div style={{ minWidth: 0 }}>
                      <Link to={`/products/${item.product.slug}`} style={styles.productName}>
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p style={styles.variantDetails}>{item.variant.name}</p>
                      )}
                      <p style={styles.unitPriceText}>${unitPrice.toLocaleString()} each</p>
                    </div>

                    {/* Quantity Modifiers */}
                    <div style={styles.qtyControls}>
                      <button 
                        disabled={item.quantity <= 1}
                        onClick={() => handleQtyChange(item.id, item.quantity, -1, stock)}
                        style={{ ...styles.qtyBtn, opacity: item.quantity <= 1 ? 0.4 : 1 }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={styles.qtySpan}>{item.quantity}</span>
                      <button 
                        disabled={item.quantity >= stock}
                        onClick={() => handleQtyChange(item.id, item.quantity, 1, stock)}
                        style={{ ...styles.qtyBtn, opacity: item.quantity >= stock ? 0.4 : 1 }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Extended Row Financials */}
                    <div style={styles.rowTotalText}>
                      ${rowTotal.toLocaleString()}
                    </div>

                    {/* Splice Control */}
                    <button 
                      title="Remove item" 
                      onClick={() => removeItem(item.id)}
                      style={styles.removeBtn}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* 2. Order Summary Sidebar */}
            <div style={styles.sidebarCard}>
              <h2 style={styles.sidebarHeading}>Order Summary</h2>
              
              <div style={styles.summaryContainer}>
                <div style={styles.summaryRow}>
                  <span>Subtotal ({item_count} items)</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                
                <div style={styles.summaryRow}>
                  <span>VAT (15%)</span>
                  <span>${vat.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div style={styles.summaryRow}>
                  <span>Shipping</span>
                  <span style={{ color: '#2ecc13' }}>Free</span>
                </div>
                
                <div style={styles.divider}></div>
                
                <div style={styles.totalRow}>
                  <span>Total</span>
                  <span>${total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button style={styles.checkoutBtn}>
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              <Link to="/products" style={styles.continueShopping}>
                ← Continue shopping
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Inline Style Configuration ──────────────────────────────
const styles = {
  pageWrapper: {
    minHeight: 'calc(-64px + 100vh)',
    background: '#f8f9fa',
    padding: '2rem 1rem',
  },
  mainContainer: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  itemCountText: {
    fontSize: '1rem',
    fontWeight: 400,
    color: '#888',
  },
  cartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '2rem',
    alignItems: 'start',
  },
  itemsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  cartRow: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'grid',
    gridTemplateColumns: '80px 1fr auto auto auto',
    gap: '1rem',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  imgWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f8f9fa',
    flexShrink: 0,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productName: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#1a1a2e',
    display: 'block',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textDecoration: 'none',
  },
  variantDetails: {
    fontSize: '0.85rem',
    color: '#888',
    marginBottom: '4px',
  },
  unitPriceText: {
    fontSize: '0.85rem',
    color: '#888',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  qtyBtn: {
    background: '#f8f9fa',
    border: 'none',
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#1a1a2e',
  },
  qtySpan: {
    padding: '0.4rem 0.75rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    minWidth: '36px',
    textAlign: 'center',
  },
  rowTotalText: {
    fontWeight: 700,
    fontSize: rem,
    color: '#1a1a2e',
    minWidth: '90px',
    textAlign: 'right',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    padding: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  sidebarCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: '80px',
  },
  sidebarHeading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin_bottom: '1.25rem',
  },
  summaryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin_bottom: '1.25rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    color: '#555',
  },
  divider: {
    borderTop: '1px solid #f0f0f0',
    margin: '0.25rem 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.1rem',
    color: '#1a1a2e',
    fontWeight: 700,
  },
  checkoutBtn: {
    width: '100%',
    background: '#e94560',
    color: '#fff',
    padding: '0.9rem',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  continueShopping: {
    display: 'block',
    textAlign: 'center',
    color: '#888',
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
}

export default Cart
