export type ProductCondition = 'NEW_WITH_TAGS' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
export type ProductRarity   = 'COMMON' | 'UNCOMMON' | 'RARE' | 'VINTAGE_RARE'
export type ProductGender   = 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS'
export type ProductStatus   = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SOLD'

export interface Category {
  id: string
  name: string
  slug: string
}

// ─── StoreTheme ───────────────────────────────────────────────────────────────

export interface StoreThemeSticker {
  emoji: string
  x: number   // % position on banner
  y: number
  size: number // px
}

export interface StoreTheme {
  bannerType?: 'solid' | 'gradient' | 'image'
  bannerColor1?: string
  bannerColor2?: string
  bannerGradientDirection?: string
  bannerImageUrl?: string | null
  bgColor?: string
  bgPattern?: 'none' | 'dots' | 'stripes' | 'checkerboard' | 'zigzag' | 'grid'
  bgPatternOpacity?: number
  stickers?: StoreThemeSticker[]
  marqueeText?: string | null
  marqueeSpeed?: 'slow' | 'medium' | 'fast'
  pageEffect?: 'none' | 'sparkles' | 'stars' | 'confetti'
  fontStyle?: 'retro' | 'minimal' | 'handwritten' | 'bold' | 'dreamy'
  accentColor?: string
  productLayout?: 'grid' | 'list' | 'magazine' | 'polaroid'
  borderStyle?: 'none' | 'solid' | 'dashed' | 'double' | 'retro'
  borderColor?: string
  showReviews?: boolean
  showDrops?: boolean
  showAbout?: boolean
}

export interface Store {
  id: string
  name: string
  storeName: string
  slug: string
  city: string
  state?: string
  bio?: string
  description?: string
  styleTags: string[]
  avatar?: string
  logo?: string
  bannerColor?: string
  dropSchedule?: string
  storeTheme?: StoreTheme | null
  followerCount?: number
  isApproved?: boolean
  isActive?: boolean
  vendor?: { displayName: string; rating?: number }
  _count?: { followers?: number }
}

export interface Product {
  id: string
  title: string
  slug: string
  description?: string
  sellingPrice: number
  originalPrice?: number
  condition: ProductCondition
  rarity?: ProductRarity
  gender?: ProductGender
  status: ProductStatus
  isAvailable: boolean
  images: string[]
  brand?: string
  size?: string
  fabric?: string
  era?: string
  city: string
  color: string[]
  style: string[]
  tags: string[]
  defects?: string
  visibleSpots?: string
  measurements?: Record<string, string>
  views?: number
  createdAt: string
  category: Category
  store: Pick<Store, 'id' | 'name' | 'slug' | 'city'>
  vendor: { id: string; displayName: string; rating?: number; ratingCount?: number }
  reviews?: Review[]
}

export interface Review {
  id: string
  rating: number
  comment?: string
  images: string[]
  createdAt: string
  buyer: { user: { email: string } }
}

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'BUYER' | 'VENDOR' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  phone: string
  role: UserRole
  isVerified: boolean
  buyer?: { id: string } | null
  vendor?: { id: string; displayName: string; isApproved: boolean } | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  vendorId: string
  vendorName: string
  storeId: string
  storeName: string
  title: string
  sellingPrice: number
  images: string[]
  condition: string
  brand: string | null
  addedAt: string
}

export interface CartGroup {
  vendorId: string
  vendorName: string
  storeId: string
  storeName: string
  items: CartItem[]
  subtotal: number
}

export interface CartResponse {
  groups: CartGroup[]
  total: number
  itemCount: number
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface OrderItemSnapshot {
  title: string
  image: string | null
  condition: string
  brand: string | null
  vendorName: string
  storeName: string
}

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  snapshot: OrderItemSnapshot
  product: { id: string; title: string; images: string[] }
}

export interface SubOrder {
  id: string
  status: OrderStatus
  subtotal: number
  vendor: { displayName: string; avatar?: string | null }
  items?: OrderItem[]
  payout?: { status: string; netAmount: number } | null
  _count?: { items: number }
}

export interface Payment {
  id?: string
  status: PaymentStatus
  amount?: number
  method?: string | null
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
}

export interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  finalAmount: number
  notes?: string | null
  shippingSnapshot?: Record<string, unknown>
  createdAt: string
  payment: Payment
  subOrders: SubOrder[]
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface VendorStats {
  totalRevenue:   number
  totalItemsSold: number
  averageRating:  number
  totalReviews:   number
  totalFollowers: number
}

export interface VendorOrderItem {
  id:        string
  quantity:  number
  unitPrice: number
  price:     number
  snapshot:  {
    title:      string
    images:     string[]
    brand?:     string | null
    size?:      string | null
    condition:  string
    vendorName: string
    storeName:  string
  }
  product: { id: string; title: string; images: string[] }
}

export interface VendorSubOrderShippingAddress {
  name:    string
  phone:   string
  line1:   string
  line2?:  string
  city:    string
  state:   string
  pincode: string
}

export interface VendorSubOrder {
  id:              string
  status:          OrderStatus
  subtotal:        number
  createdAt:       string
  shippingAddress: VendorSubOrderShippingAddress | null
  order: {
    id:               string
    createdAt:        string
    shippingSnapshot: Record<string, string>
    buyer: { user: { email: string; phone: string } }
  }
  items: VendorOrderItem[]
  payout: { status: string; netAmount: number; grossAmount: number; platformFee: number } | null
}

export interface Drop {
  id:          string
  dropTitle:   string
  description?: string
  scheduledAt: string
  isLive:      boolean
  productIds:  string[]
  store:       { name: string; slug: string; city: string }
  vendor:      { displayName: string }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalRevenue:           number
  totalOrders:            number
  totalVendors:           number
  totalBuyers:            number
  totalProducts:          number
  totalStores:            number
  totalItemsSold:         number
  pendingVendorApprovals: number
  pendingPayouts:         number
  pendingPayoutsCount?:   number
  pendingPayoutsAmount?:  number
}

export interface AdminVendor {
  id:          string
  displayName: string
  isApproved:  boolean
  isSuspended: boolean
  email:       string
  storeName:   string | null
  createdAt:   string
  user: { id: string; email: string; phone: string; isSuspended: boolean; createdAt: string }
  store: { id: string; name: string; slug: string; isApproved: boolean; isActive: boolean } | null
  _count: { products: number; subOrders: number }
}

export interface AdminBuyer {
  id:          string
  displayName: string
  email:       string
  phone:       string | null
  isSuspended: boolean
  totalOrders: number
  createdAt:   string
  user: { id: string; email: string; phone: string; isSuspended: boolean; isVerified: boolean; createdAt: string }
  _count: { orders: number; reviews: number; followedStores: number }
}

export interface AdminOrder {
  id:            string
  status:        OrderStatus
  totalAmount:   number
  createdAt:     string
  buyerName:     string | null
  paymentStatus: PaymentStatus | null
  itemCount:     number | null
  buyer:         { user: { email: string; phone: string } }
  payment:       { status: PaymentStatus; amount: number; razorpayOrderId: string | null }
  _count:        { subOrders: number }
}

export interface AdminPayout {
  id:          string
  status:      'PENDING' | 'PAID' | 'FAILED'
  amount:      number
  grossAmount: number
  platformFee: number
  netAmount:   number
  createdAt:   string
  vendorName:  string | null
  storeName:   string | null
  periodStart: string | null
  periodEnd:   string | null
  vendor:      { displayName: string; user: { email: string } }
  subOrder:    { id: string; orderId: string; subtotal: number } | null
  processedAt: string | null
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export interface CheckoutResponse {
  order: {
    id: string
    totalAmount: number
    itemCount: number
    subOrderCount: number
  }
  payment: {
    razorpayOrderId: string
    amount: number
    currency: string
    keyId: string
  }
}
