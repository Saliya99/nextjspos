// Database Models based on the Java system
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'cashier' | 'storekeeper'
  avatarUrl?: string
}

export interface NavigationSubItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  submenu?: NavigationSubItem[]
}

export interface GrnItem {
  grnItemsId: number
  costPrice: number | null
  sellingPrice: number | null
  orderedQty: number | null
  quantity: number | null
}

export interface Product {
  productId: number
  productName: string
  productNumber: string
  productLocation: string
  productDetails?: string
  productQty: number | null
  productType: string
  productCost: number
  productSelling: number
  latestPrice?: number
}

export interface Customer {
  clientId: number
  clientFirstName: string
  clientLastName: string
  email?: string
  contactNumber?: string
  address?: string
}

export interface PriceBatch {
  priceBatchId: number
  costPrice: number
  sellingPrice: number
  itemId: number
  grnId: number
}

export interface Invoice {
  invoiceId: number
  invoiceNumber: number
  clientId: number
  clientName: string
  invoiceDateTime: string
  vat: number
  vatPrice: number
  discount: number
  discountPrice: number
  grandTotal: number
  status: number
  userId: number
}

export interface InvoiceItem {
  invoiceItemId: number
  invoiceId: number
  priceBatchId: number
  productQty: number
  sellingPrice: number
  itemDiscount: number
  itemSubTotal: number
  productName: string
  productNumber: string
}

export interface Supplier {
  supplier_id: number
  supplier_name: string
  supplier_contact_number: string
  supplier_address: string
}

export interface ProductBrand {
  productBrandId: number
  productBrandName: string
}

export interface ProductCategory {
  productCategoryId: number
  productCategoryName: string
}

export interface GRN {
  grnId: number
  supplierName: string
  invoiceNumber: string
  grnNumber: string
  grnNote: string
  grnDate: string
  status: number
}

export interface DashboardStats {
  invoiceCount: string
  customerCount: string
  soldItemCount: string
  todayRevenue: string
  monthlyRevenue: string
  todayRecentOrders: RecentOrder[]
}

export interface RecentOrder {
  invoice_id: number
  customer_name: string
  grand_total: string
}

export interface SearchProductResult extends Product {
  availableQty: string
  grnItemsId: number
  productCategory?: ProductCategory
  productBrand?: ProductBrand
  grnData?: GrnItem[]
}

export interface SearchCustomerResult extends Customer {
  frist_name: string
  last_name: string
  contact_no: number
}

export interface CartItem {
  productId: number
  productName: string
  productNumber: string
  quantity: number
  sellingPrice: number
  discount: number
  total: number
  priceBatchId?: number
  grnItemsId: number
  productQty: number
}

export interface InvoiceCalculation {
  subtotal: number
  vatAmount: number
  discountAmount: number
  grandTotal: number
}

export interface PaginationInfo {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
  has_more_pages: boolean
  has_previous_pages: boolean
  next_page_url: string | null
  previous_page_url: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
  message: string
  success: boolean
  error?: unknown
}