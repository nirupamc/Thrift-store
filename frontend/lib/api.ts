import axios from 'axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  Store,
  StoreTheme,
  Category,
  Review,
  CartResponse,
  Order,
  CheckoutResponse,
  AuthUser,
  AuthTokens,
  VendorStats,
  VendorSubOrder,
  Drop,
  PlatformStats,
  AdminVendor,
  AdminBuyer,
  AdminOrder,
  AdminPayout,
} from './types'

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Types for paginated backend response ─────────────────────────────────────

interface BackendPaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginatedResponse<T>['meta']
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductsQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  condition?: string
  rarity?: string
  gender?: string
  era?: string
  city?: string
  brand?: string
  search?: string
  priceMin?: number
  priceMax?: number
  storeId?: string
}

export async function fetchProducts(params: ProductsQuery = {}): Promise<PaginatedResponse<Product>> {
  const res = await api.get<BackendPaginatedResponse<Product>>('/products', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`)
  return res.data.data
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export interface StoresQuery {
  page?: number
  limit?: number
  search?: string
  city?: string
  styleTag?: string
}

export async function fetchStores(params: StoresQuery = {}): Promise<PaginatedResponse<Store>> {
  const res = await api.get<BackendPaginatedResponse<Store>>('/stores', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function fetchStore(storeId: string): Promise<Store> {
  const res = await api.get<ApiResponse<Store>>(`/stores/${storeId}`)
  return res.data.data
}

export async function fetchStoreProducts(
  storeId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Product>> {
  const res = await api.get<BackendPaginatedResponse<Product>>(`/stores/${storeId}/products`, { params })
  return { data: res.data.data, meta: res.data.meta }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function fetchProductReviews(
  productId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Review>> {
  const res = await api.get<BackendPaginatedResponse<Review>>(`/reviews/product/${productId}`, { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function fetchStoreReviews(
  storeId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Review>> {
  const res = await api.get<BackendPaginatedResponse<Review>>(`/reviews/store/${storeId}`, { params })
  return { data: res.data.data, meta: res.data.meta }
}

// ─── Social ───────────────────────────────────────────────────────────────────

export async function followStore(storeId: string): Promise<void> {
  await api.post(`/stores/${storeId}/follow`)
}

export async function unfollowStore(storeId: string): Promise<void> {
  await api.delete(`/stores/${storeId}/follow`)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string
  phone: string
  password: string
  role: 'BUYER' | 'VENDOR'
  displayName?: string
}

export interface AuthResponseData {
  user: AuthUser
  tokens: AuthTokens
}

export async function registerUser(data: RegisterInput): Promise<AuthResponseData> {
  const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register', data)
  return res.data.data
}

export async function loginUser(data: { email: string; password: string }): Promise<AuthResponseData> {
  const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login', data)
  return res.data.data
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken })
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function fetchCart(): Promise<CartResponse> {
  const res = await api.get<ApiResponse<CartResponse>>('/cart')
  return res.data.data
}

export async function addToCart(productId: string): Promise<void> {
  await api.post('/cart', { productId })
}

export async function removeFromCart(productId: string): Promise<void> {
  await api.delete(`/cart/${productId}`)
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart')
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export async function checkout(data: { shippingAddress: ShippingAddress; notes?: string }): Promise<CheckoutResponse> {
  const res = await api.post<ApiResponse<CheckoutResponse>>('/orders/checkout', data)
  return res.data.data
}

export async function verifyPayment(data: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): Promise<{ orderId: string }> {
  const res = await api.post<ApiResponse<{ orderId: string }>>('/orders/verify', data)
  return res.data.data
}

export async function fetchOrders(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Order>> {
  const res = await api.get<BackendPaginatedResponse<Order>>('/orders', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const res = await api.get<ApiResponse<Order>>(`/orders/${orderId}`)
  return res.data.data
}

// ─── Following ────────────────────────────────────────────────────────────────

export async function fetchFollowedStores(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Store>> {
  const res = await api.get<BackendPaginatedResponse<Store>>('/stores/following', { params })
  return { data: res.data.data, meta: res.data.meta }
}

// ─── Vendor: Store ────────────────────────────────────────────────────────────

export async function createVendorStore(data: {
  storeName: string
  bio?: string
  city: string
  state?: string
  styleTags?: string[]
}): Promise<Store> {
  const res = await api.post<ApiResponse<Store>>('/stores', data)
  return res.data.data
}

export async function updateVendorStore(storeId: string, formData: FormData): Promise<Store> {
  const res = await api.patch<ApiResponse<Store>>(`/stores/${storeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function saveStoreTheme(
  storeId: string,
  theme: StoreTheme,
  bannerFile?: File,
): Promise<Store> {
  if (bannerFile) {
    const fd = new FormData()
    fd.append('storeTheme', JSON.stringify(theme))
    fd.append('bannerImage', bannerFile)
    const res = await api.patch<ApiResponse<Store>>(`/stores/${storeId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  }
  const res = await api.patch<ApiResponse<Store>>(`/stores/${storeId}`, { storeTheme: theme })
  return res.data.data
}

export async function fetchMyStore(): Promise<Store | null> {
  const res = await api.get<ApiResponse<Store | null>>('/stores/mine')
  return res.data.data
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<ApiResponse<Category[]>>('/categories')
  return res.data.data
}

export async function fetchVendorStoreStats(storeId: string): Promise<VendorStats> {
  const res = await api.get<ApiResponse<VendorStats>>(`/stores/${storeId}/stats`)
  return res.data.data
}

// ─── Vendor: Products ─────────────────────────────────────────────────────────

export async function createVendorProduct(formData: FormData): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function updateVendorProduct(id: string, formData: FormData): Promise<Product> {
  const res = await api.patch<ApiResponse<Product>>(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function deleteVendorProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

// ─── Vendor: Sub-orders ───────────────────────────────────────────────────────

export async function fetchVendorOrders(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<VendorSubOrder>> {
  const res = await api.get<BackendPaginatedResponse<VendorSubOrder>>('/orders/vendor', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function updateSubOrderStatus(
  subOrderId: string,
  status: 'SHIPPED' | 'DELIVERED',
): Promise<VendorSubOrder> {
  const res = await api.patch<ApiResponse<VendorSubOrder>>(
    `/orders/vendor/${subOrderId}/status`,
    { status },
  )
  return res.data.data
}

// ─── Vendor: Drops ────────────────────────────────────────────────────────────

export async function createDrop(
  storeId: string,
  data: { dropTitle: string; description?: string; scheduledAt: string; productIds: string[] },
): Promise<Drop> {
  const res = await api.post<ApiResponse<Drop>>(`/stores/${storeId}/drops`, data)
  return res.data.data
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function fetchAdminStats(): Promise<PlatformStats> {
  const res = await api.get<ApiResponse<PlatformStats>>('/admin/stats')
  return res.data.data
}

export async function fetchAdminVendors(
  params: { page?: number; limit?: number; search?: string; isApproved?: boolean; isSuspended?: boolean } = {},
): Promise<PaginatedResponse<AdminVendor>> {
  const res = await api.get<BackendPaginatedResponse<AdminVendor>>('/admin/vendors', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function approveVendor(vendorId: string): Promise<void> {
  await api.patch(`/admin/vendors/${vendorId}/approve`)
}

export async function suspendVendor(vendorId: string): Promise<void> {
  await api.patch(`/admin/vendors/${vendorId}/suspend`)
}

export async function fetchAdminBuyers(
  params: { page?: number; limit?: number; search?: string; isSuspended?: boolean } = {},
): Promise<PaginatedResponse<AdminBuyer>> {
  const res = await api.get<BackendPaginatedResponse<AdminBuyer>>('/admin/buyers', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function suspendBuyer(buyerId: string): Promise<void> {
  await api.patch(`/admin/buyers/${buyerId}/suspend`)
}

export async function fetchAdminOrders(
  params: { page?: number; limit?: number; status?: string; dateFrom?: string; dateTo?: string } = {},
): Promise<PaginatedResponse<AdminOrder>> {
  const res = await api.get<BackendPaginatedResponse<AdminOrder>>('/admin/orders', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function fetchAdminPayouts(
  params: { page?: number; limit?: number; status?: string } = {},
): Promise<PaginatedResponse<AdminPayout>> {
  const res = await api.get<BackendPaginatedResponse<AdminPayout>>('/admin/payouts', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export async function markPayoutPaid(payoutId: string): Promise<AdminPayout> {
  const res = await api.patch<ApiResponse<AdminPayout>>(`/admin/payouts/${payoutId}/mark-paid`)
  return res.data.data
}

export default api
