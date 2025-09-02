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

// Fixed Asset Register Types
export interface FixedAsset {
  id: number
  description: string
  serialNumber: string
  dateOfPurchase: string
  cost: number
  location: string
  accumulatedDepreciation: number
  writtenDownValue: number
  source: string
  supplier: string
  ownership: 'Owned' | 'Leased' | 'Donated'
  category: string
  status: 'Active' | 'Disposed' | 'Under Maintenance'
  depreciationRate: number
  usefulLife: number
  createdAt: string
  updatedAt: string
}

export interface AssetCategory {
  id: number
  name: string
  depreciationRate: number
  usefulLife: number
}

export interface DepreciationEntry {
  id: number
  assetId: number
  assetDescription: string
  year: number
  openingValue: number
  depreciationAmount: number
  closingValue: number
  method: 'Straight Line' | 'Reducing Balance'
  createdAt: string
}

export interface FARUser {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Accountant' | 'Auditor'
  permissions: string[]
  isActive: boolean
  createdAt: string
}

export interface UserRole {
  id: number
  name: string
  permissions: string[]
  description: string
}

// Additional types for existing system
export interface PaymentMethod {
  id: number
  method: string
}

export interface GRNItemWithTemp {
  grnItemsId: number
  productId: number
  costPrice: number
  sellingPrice: number
  orderedQty: number
  quantity: number
  tempId: number
  name: string
  reorderMargin: number
}

export interface GRNDetail {
  grnNumber: string
  invoiceNumber: string
  date: string
  items: Array<{
    name: string
    product_number: string
    quantity: number
    cost: string
  }>
  supplierName: string
  totalCost: string
}

export interface ReOrderItem {
  grn_items_id: number
  product_name: string
  product_number: string
  current_quantity: number
  re_order_margin: number
}

export interface SortState {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface DiscountReportItem {
  date_time: string
  invoice_id: string
  product_name: string
  original_price: string
  discount_amount: string
  final_price: string
  employee: string
  customer: string
}

export interface ShopConfig {
  shop_id: number
  shop_name: string
  shop_email: string
  shop_tel: string
  shop_landline?: string
  address_line1: string
  address_line2?: string
  address_line3?: string
  receipt_config: {
    tax_label: string
    show_tax_number: boolean
    tax_number?: string
    business_reg_number?: string
    logo_path?: string
  }
}

export interface InvoiceData {
  invoice_id: number
  items: Array<{
    productName: string
    productNumber: string
    quantity: number
    sellingPrice: number
    discount: number
    total: number
  }>
  customer?: Customer
  totals: InvoiceCalculation
  vatPercentage: number
  discountPercentage: number
  discountAmount: number
  paymentMethods: PaymentMethod[]
  createdAt: string
}

export interface ThermalReceiptProps {
  shopConfig: ShopConfig
  invoiceData: InvoiceData
}

// Component Props Types
export interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => void
  register: any
  handleSubmit: any
  errors: any
  isSubmitting: boolean
  onReset: () => void
}

export interface CartComponentProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: number, newQuantity: number, grnItemsId: number, productQty: number) => void
  onUpdateDiscount: (productId: number, discount: number) => void
  onRemoveItem: (productId: number, grnItemsId: number) => void
}

export interface CustomerSearchProps {
  searchCustomerTerm: string
  setSearchCustomerTerm: (term: string) => void
  customerList: Customer[]
  onCustomerSelect: (customer: Customer) => void
  onAddCustomer: () => void
  searchCustomerRef: React.RefObject<HTMLInputElement>
}

export interface ProductSearchProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchResults: SearchProductResult[]
  onAddToCart: (product: SearchProductResult) => void
  searchInputRef: React.RefObject<HTMLInputElement>
}

export interface InvoiceSummaryProps {
  selectedCustomer: Customer | null
  onRemoveCustomer: () => void
  vatPercentage: number
  setVatPercentage: (percentage: number) => void
  discountPercentage: number
  setDiscountPercentage: (percentage: number) => void
  totals: InvoiceCalculation
  paymentMethods: PaymentMethod[]
  paymentMethodId: number | null
  setPaymentMethodId: (id: number | null) => void
  loading: boolean
  cartLength: number
  onCreateInvoice: () => void
  onHoldInvoice: () => void
  onClearCart: () => void
}

export interface ExtendedInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddMore: () => void
  onPrint: () => void
  invoiceData: InvoiceData | null
  onHoldInvoice?: () => void
  onDeleteInvoice?: () => void
  onRestoreToCart?: () => void
}

export interface HoldInvoice {
  contact: string
  customer: Customer | null
  userId: string
  Product: CartItem[]
  vatPercentage: number
  discountPercentage: number
  grandTotal: number
}

export interface HoldInvoiceModelsProps {
  onSelectInvoiceIndex: (index: number) => void
}