import { requireSupabase } from '../lib/supabase.js'

export const products = []

export async function initializeProducts() {
  const { data, error } = await requireSupabase()
    .from('products')
    .select('id, name, slug, category, variant, specs, price, stock, image, images')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Unable to load the product catalog: ${error.message}`)
  products.splice(0, products.length, ...data.map(normalizeProduct))
}

export function findProduct(id) {
  return products.find((product) => product.id === id)
}

export async function addProduct({ name, category, specs, variant, price, stock, images, image }) {
  const normalizedName = name.trim()
  const normalizedCategory = normalizeStoreCategory(category)
  const normalizedSpecs = String(specs ?? variant ?? '').trim()
  const parsedPrice = Number(price)
  const parsedStock = Number(stock)

  if (!normalizedName || !normalizedSpecs) {
    throw new Error('Name and specifications are required.')
  }
  if (!normalizedCategory) {
    throw new Error('Choose Computers, Smartphones, Butchery Equipment, or Kitchenware as the product category.')
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new Error('Enter a price greater than zero.')
  }
  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    throw new Error('Stock must be a whole number of zero or more.')
  }

  const baseSlug = createSlug(normalizedName)
  let slug = baseSlug
  let suffix = 2
  while (products.some((product) => product.slug === slug)) {
    slug = `${baseSlug}-${suffix++}`
  }
  const id = `product-${slug}`
  const productImages = await persistProductImages(
    images ?? (image ? [image] : []),
    slug,
    normalizedCategory
  )

  const { data, error } = await requireSupabase()
    .from('products')
    .insert({
      id,
      name: normalizedName,
      slug,
      category: normalizedCategory,
      variant: normalizedSpecs,
      specs: normalizedSpecs,
      price: parsedPrice,
      stock: parsedStock,
      image: productImages[0],
      images: productImages
    })
    .select('id, name, slug, category, variant, specs, price, stock, image, images')
    .single()

  if (error) throw new Error(`Unable to save product: ${error.message}`)
  const product = normalizeProduct(data)
  products.unshift(product)
  return product
}

export async function updateProduct(id, { name, specs, price, stock, images }) {
  const product = findProduct(id)
  if (!product) throw new Error('This product is no longer available.')

  const normalizedName = String(name ?? '').trim()
  const normalizedSpecs = String(specs ?? '').trim()
  const parsedPrice = Number(price)
  const parsedStock = Number(stock)

  if (!normalizedName || !normalizedSpecs) {
    throw new Error('Name and specifications are required.')
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new Error('Enter a price greater than zero.')
  }
  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    throw new Error('Stock must be a whole number of zero or more.')
  }
  if (!Array.isArray(images) || !images.some((image) => String(image).trim())) {
    throw new Error('Keep or add at least one product image.')
  }

  const productImages = await persistProductImages(images, product.slug, product.category)
  const { data, error } = await requireSupabase()
    .from('products')
    .update({
      name: normalizedName,
      variant: normalizedSpecs,
      specs: normalizedSpecs,
      price: parsedPrice,
      stock: parsedStock,
      image: productImages[0],
      images: productImages
    })
    .eq('id', id)
    .select('id, name, slug, category, variant, specs, price, stock, image, images')
    .single()

  if (error) throw new Error(`Unable to update product: ${error.message}`)
  const updatedProduct = normalizeProduct(data)
  const index = products.findIndex((item) => item.id === id)
  products.splice(index, 1, updatedProduct)
  return updatedProduct
}

export async function removeProduct(id) {
  const { error } = await requireSupabase().from('products').delete().eq('id', id)
  if (error) throw new Error(`Unable to remove product: ${error.message}`)

  const index = products.findIndex((product) => product.id === id)
  if (index !== -1) products.splice(index, 1)
  return index !== -1
}

function normalizeProduct(product) {
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : product.image ? [product.image] : []
  return {
    ...product,
    specs: product.specs || product.variant || '',
    images,
    image: product.image || images[0] || '',
    price: Number(product.price),
    stock: Number(product.stock)
  }
}

function normalizeStoreCategory(category) {
  if (typeof category !== 'string') return null
  const normalized = category.trim().toLowerCase()
  if (normalized === 'computers') return 'Computers'
  if (normalized === 'smartphones') return 'Smartphones'
  if (normalized === 'butchery equipment' || normalized === 'butchery equipments') return 'Butchery Equipment'
  if (normalized === 'kitchenware' || normalized === 'kitchen ware') return 'Kitchenware'
  return null
}

function createSlug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'product'
}

async function persistProductImages(images, slug, category) {
  const entries = images
    .map((image) => String(image).trim())
    .filter(Boolean)

  if (!entries.length) {
    if (category === 'Butchery Equipment') {
      throw new Error('Upload or provide an image for butchery equipment.')
    }
    if (category === 'Kitchenware') {
      return ['/assets/homemate-symbol.png']
    }
    return [category === 'Smartphones'
      ? '/smartphones/iphone_x_1.webp'
      : '/Laptop Sales/Lenovo (5).jpg']
  }

  const storage = requireSupabase().storage.from('product-images')
  const savedImages = []
  for (const [index, image] of entries.entries()) {
    if (image.startsWith('data:image/')) {
      const response = await fetch(image)
      if (!response.ok) throw new Error('Unable to read one of the selected product images.')
      const file = await response.blob()
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${slug}-${index + 1}-${crypto.randomUUID()}.${extension}`
      const { error } = await storage.upload(path, file, {
        contentType: file.type,
        upsert: false
      })
      if (error) throw new Error(`Unable to upload product image: ${error.message}`)
      savedImages.push(storage.getPublicUrl(path).data.publicUrl)
      continue
    }

    const safeLocalPath = image.startsWith('/') && !image.startsWith('//')
    const safeRemoteUrl = /^https?:\/\/\S+$/i.test(image)
    if (!safeLocalPath && !safeRemoteUrl) {
      throw new Error('Each image must be an http(s) URL, a local path, or an uploaded image.')
    }
    savedImages.push(image)
  }
  return savedImages
}
