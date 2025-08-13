// API Layer to connect to the same MySQL database as the Java system
import {
  Customer,
  DashboardStats,
  SearchProductResult,
  ProductBrand,
  ProductCategory,
  // Supplier,
  PaginatedResponse
} from '../types'
import config from './config'

// API Configuration from centralized config
const API_BASE_URL = config.apiUrl

class ApiClient {

  private async makeApiRequest(endpoint: string, params: Record<string, unknown> = {}, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST') {
    // Check if server is available first
    // const serverAvailable = await this.testServerConnection()
    // if (!serverAvailable) {
    //   throw new Error('Backend server is not available. Using mock data.')
    // }

    const url = new URL(`${API_BASE_URL}/${endpoint}`)

    // Add user_id from localStorage if available
    const userData = localStorage.getItem('userData')
    const user = userData ? JSON.parse(userData) : null

    if (user && user.id) {
      params.user_id = user.id
    }

    const requestConfig: RequestInit = {
      method: method,
    }

    if (method === 'POST') {
      const formData = new FormData();

      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value instanceof Blob) {
          formData.append(key, value)
        } else {
          formData.append(key, String(value))
        }
      })

      requestConfig.body = formData
    } else if (method === 'PUT') {
      const urlParams = new URLSearchParams();

      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value !== undefined && value !== null) {
          urlParams.append(key, String(value))
        }
      })

      requestConfig.body = urlParams
      requestConfig.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    } else if (method === 'GET' || method === 'DELETE') {
      Object.keys(params).forEach(key => {
        const value = params[key]
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })

      requestConfig.headers = {
        'Content-Type': 'application/json',
      }
    }

    try {
      const response = await fetch(url.toString(), requestConfig)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errors: errorData.errors || {},
          status: response.status
        }
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`${method} request failed for ${endpoint}:`, error)
      throw new Error(`${method} request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // user Authentication
  async login(email: string, password: string): Promise<void> {
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const response = await fetch(`${API_BASE_URL}/user_login`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.result) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        }

        const token = 'auth-token-' + Date.now()
        localStorage.setItem('token', token)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        throw new Error(data.msg || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error(error instanceof Error ? error.message : 'Login failed')
    }

  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const [invoiceCount, customerCount, soldItemCount, todayRevenue, monthlyRevenue, todayrecentOrders] = await Promise.all([
      this.makeApiRequest('getDashboard', { reqType: 'invoiceCount' }),
      this.makeApiRequest('getDashboard', { reqType: 'customerCount' }),
      this.makeApiRequest('getDashboard', { reqType: 'soldItemCount' }),
      this.makeApiRequest('getDashboard', { reqType: 'todayRevenue' }),
      this.makeApiRequest('getDashboard', { reqType: 'monthlyRevenue' }),
      this.makeApiRequest('getDashboard', { reqType: 'todayrecentOrders' })
    ])

    return {
      invoiceCount: invoiceCount.data.result ? this.formatNumber(invoiceCount.data.count) : '0',
      customerCount: customerCount.data.result ? this.formatNumber(customerCount.data.count) : '0',
      soldItemCount: soldItemCount.data.result ? this.formatNumber(soldItemCount.data.count) : '0',
      todayRevenue: todayRevenue.data.result ? this.formatNumber(todayRevenue.data.count) : '0',
      monthlyRevenue: monthlyRevenue.data.result ? this.formatNumber(monthlyRevenue.data.count) : '0',
      todayrecentOrders: todayrecentOrders.data.result ? todayrecentOrders.data.data : [],
    }
  }

  // Product Management
  async searchProducts(searchValue: string): Promise<SearchProductResult[]> {
    const response = await this.makeApiRequest('products/search', {
      search_value: searchValue,
      search_cat_name: 'All'
    })

    if (response.data) {
      return response.data.map((item: Record<string, unknown>) => ({
        productId: parseInt(item.ProductId as string),
        productName: item.ProductName as string,
        productNumber: item.ProductNumber as string,
        productLocation: item.ProductLocation as string,
        productDetails: item.ProductDetails as string,
        productQty: parseInt(item.ProductQty as string),
        productType: item.ProductType as string,
        productCost: parseFloat(item.ProductCost as string),
        productSelling: parseFloat(item.ProductSelling as string),
        latestPrice: item.latestPrice ? parseFloat(item.latestPrice as string) : undefined,
        availableQty: item.ProductQty,
        grnItemsId: item.grnItemsId
      }))
    }
    return []
  }

  async searchProductsWithGRN(searchValue: string, params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<SearchProductResult>> {
    try {
      const requestParams: Record<string, unknown> = {
        searchTerm: searchValue,
        ...params
      }

      const response = await this.makeApiRequest('products/search-with-grn', requestParams)
      return this.mapProductData(response)
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to search products with GRN', true)
    }
  }

  private mapProductData(response: any): PaginatedResponse<SearchProductResult> {
    if (!response.success || !response.data || !Array.isArray(response.data)) {
      return this.handleResponse(null, null, response.message || 'No products found', true) as PaginatedResponse<SearchProductResult>
    }

    const products = response.data
      .filter((item: Record<string, unknown>) => {
        return item.productId
      })
      .map((item: Record<string, unknown>) => ({
        productId: typeof item.productId === 'string' ? parseInt(item.productId, 10) :
          typeof item.productId === 'number' ? item.productId : 0,
        productName: String(item.productName || ''),
        productNumber: String(item.productNumber || ''),
        productLocation: String(item.productLocation || ''),
        productDetails: item.productDetails ? String(item.productDetails) : undefined,
        productQty: typeof item.productQty === 'string' ? parseInt(item.productQty, 10) :
          typeof item.productQty === 'number' ? item.productQty : 0,
        productType: String(item.productType || 'unit'),
        productCost: typeof item.productCost === 'string' ? parseFloat(item.productCost) :
          typeof item.productCost === 'number' ? item.productCost : 0,
        productSelling: typeof item.productSelling === 'string' ? parseFloat(item.productSelling) :
          typeof item.productSelling === 'number' ? item.productSelling : 0,
        latestPrice: item.latestPrice ? parseFloat(item.latestPrice as string) : undefined,
        availableQty: typeof item.productQty === 'string' ? parseInt(item.productQty, 10) :
          typeof item.productQty === 'number' ? item.productQty : 0,
        grnItemsId: typeof item.grnItemsId === 'string' ? parseInt(item.grnItemsId, 10) :
          typeof item.grnItemsId === 'number' ? item.grnItemsId : 0,
        productBrand: item.productBrand || null,
        productCategory: item.productCategory || null,
        grnData: Array.isArray((item as any).grnData) ? (item as any).grnData.map((grnItem: any) => ({
          grnItemsId: typeof grnItem.grnItemsId === 'string' ? parseInt(grnItem.grnItemsId, 10) :
            typeof grnItem.grnItemsId === 'number' ? grnItem.grnItemsId : 0,
          costPrice: grnItem.costPrice ? parseFloat(grnItem.costPrice) : null,
          sellingPrice: grnItem.sellingPrice ? parseFloat(grnItem.sellingPrice) : null,
          orderedQty: grnItem.orderedQty ? parseInt(grnItem.orderedQty, 10) : null,
          quantity: grnItem.quantity ? parseInt(grnItem.quantity, 10) : null,
        })) : undefined,
      }))
      .filter((product: SearchProductResult) => product.productId > 0)

    const successResponse = {
      data: products,
      pagination: response.pagination || {
        current_page: 1,
        per_page: 10,
        total: products.length,
        last_page: 1,
        from: products.length > 0 ? 1 : null,
        to: products.length,
        has_more_pages: false,
        has_previous_pages: false,
        next_page_url: null,
        previous_page_url: null,
      },
      message: response.message || 'Products retrieved successfully',
      success: true
    }

    return this.handleResponse(successResponse, null, undefined, true) as PaginatedResponse<SearchProductResult>
  }

  async getAllProducts(params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    include_grn?: boolean
    paginate?: boolean
  }): Promise<PaginatedResponse<SearchProductResult>> {
    try {
      const response = await this.makeApiRequest('products', params, 'GET')
      return this.mapProductData(response)
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to retrieve products', true)
    }
  }

  async addNewProduct(productData: {
    productName: string
    productLocation: string
    productDetails: string
    productType?: string
    productCost: string
    productSelling: string
    productQty: string
    brandId?: number
    categoryId?: number
  }) {
    try {
      const response = await this.makeApiRequest('products', productData, 'POST')
      return this.handleResponse(response, null, 'Failed to add product')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to add product')
    }
  }

  async updateProduct(productId: number, productData: {
    productName: string
    productLocation: string
    productDetails: string
    productType?: string
    productCost: string
    productSelling: string
    productQty: string
    brandId?: number
    categoryId?: number
  }) {
    try {
      const response = await this.makeApiRequest(`products/${productId}`, productData, 'PUT')
      return this.handleResponse(response, null, 'Failed to update product')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to update product')
    }
  }

  async deleteProduct(productId: number) {
    try {
      const response = await this.makeApiRequest(`products/${productId}`, {}, 'DELETE')
      return this.handleResponse(response, null, 'Failed to delete product')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to delete product')
    }
  }

  async getLatestPrice(productNumber: string): Promise<number> {
    try {
      const response = await this.makeApiRequest('get_product_latest_price.php', {
        product_id: productNumber
      })

      return response.result ? parseFloat(response.data) : 0
    } catch (error) {
      console.error('Get latest price failed:', error)
      return 0
    }
  }

  // Common

  private handleResponse(response: any, error?: unknown, defaultMessage?: string, isPaginated: boolean = false): any {
    if (error) {
      if (isPaginated) {
        return {
          data: [],
          pagination: {
            current_page: 1,
            per_page: 10,
            total: 0,
            last_page: 1,
            from: null,
            to: null,
            has_more_pages: false,
            has_previous_pages: false,
            next_page_url: null,
            previous_page_url: null,
          },
          message: error instanceof Error ? error.message : (defaultMessage || 'Request failed'),
          success: false,
          error: error
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : (defaultMessage || 'Request failed'),
        error: error
      }
    }

    if (typeof response === 'object' && response !== null && 'success' in response) {
      return response
    }

    return {
      success: false,
      message: 'Unexpected response format from server',
      response: response
    }
  }

  // Customer Management

  private mapCustomerData(response: any): PaginatedResponse<Customer> {
    if (!response.success || !response.data || !Array.isArray(response.data)) {
      return this.handleResponse(null, null, response.message || 'No customers found', true) as PaginatedResponse<Customer>
    }

    const customers = response.data
      .filter((item: Record<string, unknown>) => {
        return item.id
      })
      .map((item: Record<string, unknown>) => ({
        clientId: typeof item.id === 'string' ? parseInt(item.id, 10) :
          typeof item.id === 'number' ? item.id : 0,
        clientFirstName: String(item.first_name || ''),
        clientLastName: String(item.last_name || ''),
        email: item.email ? String(item.email) : undefined,
        contactNumber: item.contact_no ? String(item.contact_no) : undefined,
        address: item.address ? String(item.address) : undefined,
      }))
      .filter((customer: Customer) => customer.clientId > 0)

    const successResponse = {
      data: customers,
      pagination: response.pagination || {
        current_page: 1,
        per_page: 10,
        total: customers.length,
        last_page: 1,
        from: customers.length > 0 ? 1 : null,
        to: customers.length,
        has_more_pages: false,
        has_previous_pages: false,
        next_page_url: null,
        previous_page_url: null,
      },
      message: response.message || 'Customers retrieved successfully',
      success: true
    }

    return this.handleResponse(successResponse, null, undefined, true) as PaginatedResponse<Customer>
  }

  async searchCustomers(searchValue: string, params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<Customer>> {
    try {
      const requestParams: Record<string, unknown> = {
        searchTerm: searchValue,
        ...params
      }

      const response = await this.makeApiRequest('customers/search', requestParams)
      return this.mapCustomerData(response)
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to search customers', true)
    }
  }

  async getAllCustomers(params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<Customer>> {
    try {
      const response = await this.makeApiRequest('customers', params, 'GET')
      return this.mapCustomerData(response)
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to retrieve customers', true)
    }
  }

  async addNewCustomer(customerData: Partial<Customer>) {
    try {
      const response = await this.makeApiRequest('customers', customerData, 'POST')
      return this.handleResponse(response, null, 'Failed to add customer')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to add customer')
    }
  }

  async updateCustomer(customerId: number, customerData: Partial<Customer>) {
    try {
      const response = await this.makeApiRequest(`customers/${customerId}`, customerData, 'PUT')
      return this.handleResponse(response, null, 'Failed to update customer')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to update customer')
    }
  }

  async deleteCustomer(customerId: number) {
    try {
      const response = await this.makeApiRequest(`customers/${customerId}`, {}, 'DELETE')
      return this.handleResponse(response, null, 'Failed to delete customer')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to delete customer')
    }
  }

  // Brand Management

  private mapProductBrandData(response: any): PaginatedResponse<ProductBrand> {
    if (!response.success || !response.data || !Array.isArray(response.data)) {
      return this.handleResponse(null, null, response.message || 'No product brands found', true) as PaginatedResponse<ProductBrand>
    }

    const productBrands = response.data
      .filter((item: Record<string, unknown>) => {
        return item.product_brand_id
      })
      .map((item: Record<string, unknown>) => ({
        productBrandId: typeof item.product_brand_id === 'string' ? parseInt(item.product_brand_id, 10) :
          typeof item.product_brand_id === 'number' ? item.product_brand_id : 0,
        productBrandName: String(item.brand_name || ''),
      }))
      .filter((productBrand: ProductBrand) => productBrand.productBrandId > 0)

    const successResponse = {
      data: productBrands,
      pagination: response.pagination || {
        current_page: 1,
        per_page: 10,
        total: productBrands.length,
        last_page: 1,
        from: productBrands.length > 0 ? 1 : null,
        to: productBrands.length,
        has_more_pages: false,
        has_previous_pages: false,
        next_page_url: null,
        previous_page_url: null,
      },
      message: response.message || 'Product brands retrieved successfully',
      success: true
    }

    return this.handleResponse(successResponse, null, undefined, true) as PaginatedResponse<ProductBrand>
  }

  async getAllProductBrands(params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<ProductBrand>> {
    try {
      const response = await this.makeApiRequest('products/brands', params, 'GET')
      return this.mapProductBrandData(response)
    } catch (error) {
      return this.mapProductBrandData(this.handleResponse(null, error, 'Failed to retrieve product brands'))
    }
  }

  async searchProductBrands(searchValue: string, params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<ProductBrand>> {
    try {
      const response = await this.makeApiRequest('products/brands/search', {
        searchTerm: searchValue,
        ...params
      }, 'POST')
      return this.mapProductBrandData(response)
    } catch (error) {
      return this.mapProductBrandData(this.handleResponse(null, error, 'Failed to search product brands'))
    }
  }

  async addNewProductBrand(productBrandData: Partial<ProductBrand>) {
    try {
      const response = await this.makeApiRequest('products/brands', productBrandData, 'POST')
      return this.handleResponse(response, null, 'Failed to create brand')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to create brand')
    }
  }

  async updateProductBrand(productBrandId: number, productBrandData: Partial<ProductBrand>) {
    try {
      const response = await this.makeApiRequest(`products/brands/${productBrandId}`, productBrandData, 'PUT')
      return this.handleResponse(response, null, 'Failed to update brand')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to update brand')
    }
  }

  async deleteProductBrand(productBrandId: number) {
    try {
      const response = await this.makeApiRequest(`products/brands/${productBrandId}`, {}, 'DELETE')
      return this.handleResponse(response, null, 'Failed to delete brand')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to delete brand')
    }
  }

  // Category Management

  private mapProductCategoryData(response: any): PaginatedResponse<ProductCategory> {
    if (!response.success || !response.data || !Array.isArray(response.data)) {
      return this.handleResponse(null, null, response.message || 'No product categories found', true) as PaginatedResponse<ProductCategory>
    }

    const productCategories = response.data
      .filter((item: Record<string, unknown>) => {
        return item.product_cat_id
      })
      .map((item: Record<string, unknown>) => ({
        productCategoryId: typeof item.product_cat_id === 'string' ? parseInt(item.product_cat_id, 10) :
          typeof item.product_cat_id === 'number' ? item.product_cat_id : 0,
        productCategoryName: String(item.category_name || ''),
      }))
      .filter((productCategory: ProductCategory) => productCategory.productCategoryId > 0)

    const successResponse = {
      data: productCategories,
      pagination: response.pagination || {
        current_page: 1,
        per_page: 10,
        total: productCategories.length,
        last_page: 1,
        from: productCategories.length > 0 ? 1 : null,
        to: productCategories.length,
        has_more_pages: false,
        has_previous_pages: false,
        next_page_url: null,
        previous_page_url: null,
      },
      message: response.message || 'Product categories retrieved successfully',
      success: true
    }

    return this.handleResponse(successResponse, null, undefined, true) as PaginatedResponse<ProductCategory>
  }

  async getAllProductCategories(params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<ProductCategory>> {
    try {
      const response = await this.makeApiRequest('products/categories', params, 'GET')
      return this.mapProductCategoryData(response)
    } catch (error) {
      return this.mapProductCategoryData(this.handleResponse(null, error, 'Failed to retrieve product categories'))
    }
  }

  async searchProductCategories(searchValue: string, params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    paginate?: boolean
  }): Promise<PaginatedResponse<ProductCategory>> {
    try {
      const response = await this.makeApiRequest('products/categories/search', {
        searchTerm: searchValue,
        ...params
      }, 'POST')
      return this.mapProductCategoryData(response)
    } catch (error) {
      return this.mapProductCategoryData(this.handleResponse(null, error, 'Failed to search product categories'))
    }
  }

  async addNewProductCategory(productCategoryData: Partial<ProductCategory>) {
    try {
      const response = await this.makeApiRequest('products/categories', productCategoryData, 'POST')
      return this.handleResponse(response, null, 'Failed to create category')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to create category')
    }
  }

  async updateProductCategory(productCategoryId: number, productCategoryData: Partial<ProductCategory>) {
    try {
      const response = await this.makeApiRequest(`products/categories/${productCategoryId}`, productCategoryData, 'PUT')
      return this.handleResponse(response, null, 'Failed to update category')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to update category')
    }
  }

  async deleteProductCategory(productCategoryId: number) {
    try {
      const response = await this.makeApiRequest(`products/categories/${productCategoryId}`, {}, 'DELETE')
      return this.handleResponse(response, null, 'Failed to delete category')
    } catch (error) {
      return this.handleResponse(null, error, 'Failed to delete category')
    }
  }

  // Invoice Management
  async createInvoice(invoiceType: string, clientName: string, clientEmail: string, clientTel: string, clientId: number, userId: string) {
    return this.makeApiRequest('openinvoice', {
      invoice_type: invoiceType,
      client_name: clientName,
      client_email: clientEmail,
      client_tel: clientTel,
      client_id: clientId.toString(),
      user_id: userId
    })
  }

  async getInvoiceDetails(invoiceId: number) {
    return this.makeApiRequest('download_invoice_details.php', {
      invoice_id: invoiceId.toString()
    })
  }

  async addItemToCart(invoiceId: number, userId: string, productId: number, quantity: string, discount: string, sellingPrice: string, reqType: string = 'AddToCart') {
    return this.makeApiRequest('add_item_to_cart.php', {
      invoice_id: invoiceId.toString(),
      user_id: userId,
      product_id: productId.toString(),
      qty: quantity,
      discount: discount,
      sellPrice: sellingPrice,
      reqType: reqType
    })
  }

  async updateItemQuantity(invoiceId: number, priceBatchId: number, invoiceProductId: number, productQty: number, newDiscount: number, newQuantity: string, userId: string) {
    return this.makeApiRequest('update_item_qty_cart.php', {
      invoice_id: invoiceId.toString(),
      price_batch_id: priceBatchId.toString(),
      invoice_product_id: invoiceProductId.toString(),
      product_qty: productQty.toString(),
      product_discount: newDiscount.toString(),
      qty: newQuantity,
      user_id: userId
    })
  }

  async removeItemFromCart(invoiceId: number, priceBatchId: number, invoiceProductId: number, productQty: number) {
    return this.makeApiRequest('remove_item_qty_cart.php', {
      invoice_id: invoiceId.toString(),
      price_batch_id: priceBatchId.toString(),
      invoice_product_id: invoiceProductId.toString(),
      product_qty: productQty.toString()
    })
  }

  async updateInvoiceDiscount(invoiceId: number, discountValue: string) {
    return this.makeApiRequest('update_invoice_discount.php', {
      invoice_id: invoiceId.toString(),
      discount_value: discountValue
    })
  }

  async updateInvoiceVat(invoiceId: number, vatValue: string) {
    return this.makeApiRequest('update_invoice_vat.php', {
      invoice_id: invoiceId.toString(),
      vat_value: vatValue
    })
  }

  async saveInvoice(invoiceId: number, userId: string, receptType: string) {
    return this.makeApiRequest('saveinvoice', {
      invoice_id: invoiceId.toString(),
      user_id: userId,
      recept_type: receptType
    })
  }

  async deleteInvoice(invoiceId: number) {
    return this.makeApiRequest('delete_invoice.php', {
      invoice_id: invoiceId.toString()
    })
  }

  async getInvoiceList() {
    return this.makeApiRequest('download_invoice_list.php', { I: 'all' })
  }

  // Supplier Management
  async getSuppliers() {
    const response = await this.makeApiRequest('getSupplierList', { s: 'all' })

    if (response.data) {
      return response.data.map((item: Record<string, unknown>) => ({
        supplier_id: parseInt(item.supplier_id as string),
        supplier_name: item.supplier_name as string,
        supplier_address: item.supplier_address as string,
        supplier_contact_number: item.supplier_contact_number as string
      }))
    }
    return []
  }

  async addNewSupplier(supplier_id: number ,supplier_name: string,supplier_address:string, supplier_contact_number: string) {
    return this.makeApiRequest('addNewSupplier', {
      supplier_id: supplier_id as number,
      supplier_name: supplier_name as string,
      supplier_contact_number: supplier_contact_number as string,
      supplier_address: supplier_address as string
    })
  }

   //Update Supplier
   async editSupplier(supplier_id: number, supplier_name: string, supplier_address: string, supplier_contact_number: string) {
    return this.makeApiRequest(`suppliers/${supplier_id}`, {
      supplier_name: supplier_name,
      supplier_contact_number: supplier_contact_number,
      supplier_address: supplier_address
    }, 'PUT')
  }

  // Reports
  async getTodayReport() {
    return this.makeApiRequest('download_today_report.php', { r: 'today' })
  }

  async getAllReport(startDate: string, endDate: string) {
    return this.makeApiRequest('download_all_report.php', {
      start_date: startDate,
      end_date: endDate
    })
  }

  //Auth User Update Api
  async updateAuthUser(name: string, email: string, role: string) {
    const response = await this.makeApiRequest('updateAuthUser', {
      name: name,
      email: email,
      role: role,
    })
    return response.success ? response : response.json();
  }

  async uploadAvatar(avatarFile: File, userId: string) {
    const formData = new FormData()
    formData.append('avatar', avatarFile)
    formData.append('user_id', userId)

    const url = new URL(`${API_BASE_URL}/users/upload-avatar`)

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        }
      }

      const data = await response.json()

      if (data.success && data.data?.avatar_url) {
        const userData = localStorage.getItem('userData')
        if (userData) {
          const user = JSON.parse(userData)
          user.avatarUrl = `${config.backEndUrl}${data.data.avatar_url}`
          localStorage.setItem('userData', JSON.stringify(user))
        }
      }

      return data
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Utility function to format numbers with commas
  private formatNumber(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return Math.round(num).toLocaleString()
  }
}

export const apiClient = new ApiClient()