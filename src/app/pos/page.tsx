'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import FormField from '../components/forms/FormField'
import { apiClient } from '../lib/api'
import { SearchProductResult, CartItem, Customer, InvoiceCalculation } from '../types'
import { customerSchema, CustomerFormData } from '../lib/schemas'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function POSPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProductResult[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerList, setCustomers] = useState<Customer[]>([])
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [, setCurrentInvoiceId] = useState<number | null>(null)
  const [vatPercentage, setVatPercentage] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const [success, setSuccess] = useState<string| null> (null)

  const {
    register: registerCustomer,
    handleSubmit: handleCustomerSubmit,
    reset: resetCustomer,
    formState: { errors: customerErrors, isSubmitting: isSubmittingCustomer }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchCustomerRef = useRef<HTMLInputElement>(null)
  const [searchCustomerTerm, setSearchCustomerTerm] = useState('')
  // Memoized search function
  const searchProducts = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      const results = await apiClient.searchProducts(searchTerm)
      setSearchResults(results)
      setError(null)
    } catch (error) {
      console.error('Failed to search products:', error)
      setError('Failed to search products. Please try again.')
      setSearchResults([])
    }
  }, [searchTerm])

    // Define getCustomers first
    const getCustomers = useCallback(async () => {
      if (!searchCustomerTerm.trim()) {
        setCustomers([])
        return
      }
  
      try {
        const customerList = await apiClient.searchCustomers(searchCustomerTerm)
        setCustomers(customerList.data || [])
        console.log(customerList)
        setError(null)
      } catch (error) {
        console.error('Failed to search customer:', error)
        setError('Failed to search customer. Please try again.')
        setCustomers([])
      }
    }, [searchCustomerTerm])

  useEffect(() => {
    // loadCustomers()
    // Focus search input on load
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
    if(searchCustomerRef.current){
      searchCustomerRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts()
      } else {
        setSearchResults([])
      }
  
      if (searchCustomerTerm.trim()) {
        getCustomers()
      }
    }, 300)
  
    return () => clearTimeout(timer)
  }, [searchTerm, searchProducts, searchCustomerTerm, getCustomers])

  const addToCart = (product: SearchProductResult) => {
    const existingItem = cart.find(item => item.grnItemsId === product.grnItemsId)
    if (existingItem) {

      if(product.productQty && product.productQty >= existingItem.quantity){
        console.error('Failed to load customers:');
      }else{
        updateCartItemQuantity(existingItem.productId, existingItem.quantity + 1, existingItem.grnItemsId,existingItem.productQty)
      }
      
    } else {

      if(product.productQty == 0){
        console.error('Failed to load customers:');
      }else{
        const newItem: CartItem = {
          grnItemsId: product.grnItemsId,
          productId: product.productId,
          productName: product.productName,
          productNumber: product.productNumber,
          quantity: 1,
          sellingPrice: product.latestPrice || product.productSelling,
          discount: 0,
          total: product.latestPrice || product.productSelling,
          productQty: product.productQty || 0,
        }
        setCart([...cart, newItem])
      }
      
    }
    
    // Clear search
    setSearchTerm('')
    setSearchResults([])
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const updateCartItemQuantity = (productId: number, newQuantity: number, grnItemsId: number, productQty: number) => {

    if (newQuantity <= 0) {
      removeFromCart(productId,grnItemsId)
      return
    }

    if(productQty < newQuantity){
      alert('Out of Stock')
      return
    }
    
    setCart(cart.map(item => 
      item.grnItemsId === grnItemsId 
        ?{ 
            ...item, 
            quantity: newQuantity, 
            total: (item.sellingPrice - item.discount) * newQuantity 
          }
        : item
    ))
  }

  const updateCartItemDiscount = (productId: number, discount: number) => {
    setCart(cart.map(item => 
      item.productId === productId 
        ? { 
            ...item, 
            discount, 
            total: (item.sellingPrice - discount) * item.quantity 
          }
        : item
    ))
  }

  const removeFromCart = (productId: number,grnItemsId:number) => {
    setCart(cart.filter(item => item.grnItemsId !== grnItemsId))
  }

  const calculateTotals = (): InvoiceCalculation => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const vatAmount = (subtotal * vatPercentage) / 100
    const grandTotal = subtotal + vatAmount - discountAmount
    
    return {
      subtotal,
      vatAmount,
      discountAmount,
      grandTotal: Math.max(0, grandTotal)
    }
  }

  const createInvoice = async () => {
    // if (!selectedCustomer) {
    //   alert('Please select a customer')
    //   return
    // }
    if (cart.length === 0) {
      alert('Please add items to cart')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.createInvoice(
        'Regular',
        `${selectedCustomer?.clientFirstName} ${selectedCustomer?.clientLastName}`,
        selectedCustomer?.email || '',
        selectedCustomer?.contactNumber || '',
        selectedCustomer?.clientId || 0,
        user?.id.toString() || '1'
      )
 
      if (response.result && response.invoiceId) {
        const invoiceId = response.invoiceId
        setCurrentInvoiceId(invoiceId)
        
        // Add items to invoice
        for (const item of cart) {
          await apiClient.addItemToCart(
            invoiceId,
            user?.id.toString() || '1',
            item.productId,
            item.quantity.toString(),
            item.discount.toString(),
            item.sellingPrice.toString()
          )
        }

        // Update VAT and discount
        if (vatPercentage > 0) {
          await apiClient.updateInvoiceVat(invoiceId, vatPercentage.toString())
        }
        if (discountAmount > 0) {
          await apiClient.updateInvoiceDiscount(invoiceId, discountAmount.toString())
        }

        // Save invoice
        await apiClient.saveInvoice(invoiceId, user?.id.toString() || '1', 'Regular')
        
        alert('Invoice created successfully!')
        clearCart()
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
      setError('Failed to create invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setVatPercentage(0)
    setDiscountAmount(0)
    setCurrentInvoiceId(null)
  }

  const onCustomerSubmit = async (data: CustomerFormData) => {
    setError(null)
    try {
      const response = await apiClient.addNewCustomer(data)
      if (response.success) {
        toast.success('Customer added successfully!')
        setShowAddProductModal(false)
        resetCustomer()
        if (searchTerm.trim()) {
          await searchProducts()
        }
      } else {
        toast.error(response.message || 'Failed to add customer')
      }
    } catch {
      toast.error('Failed to add customer. Please try again.')
    }
  }



  const totals = calculateTotals()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Point of Sale" 
          subtitle="Process customer transactions" 
        />
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Panel - Product Search */}
            <div className="lg:col-span-2 flex flex-col">
              {/* Search Bar */}
              <div className="card mb-4">
                <div className="card-body">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="card flex-1">
                <div className="card-header">
                  <h3 className="text-lg font-medium">Products</h3>
                </div>
                <div className="card-body p-0 overflow-y-auto max-h-[400px]">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {searchResults.map((product) => (
                        <div
                          key={product.grnItemsId}
                          className="p-4 h-20 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] transition-transform transition-colors duration-200"
                          onClick={() => addToCart(product)}
                          style={{ transformOrigin: 'center' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{product.productName}</h4>
                              <p className="text-sm text-gray-500">
                                {product.productNumber} • {product.productLocation}
                              </p>
                              <p className="text-sm text-gray-600">Available: {product.availableQty}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                LKR {(product.latestPrice || product.productSelling).toLocaleString()}
                              </p>
                              {product.latestPrice && product.latestPrice !== product.productSelling && (
                                <p className="text-sm text-gray-500 line-through">
                                  LKR {product.productSelling.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      {searchTerm ? 'No products found' : 'Search for products to add to cart'}
                    </div>
                  )}
                </div>
              </div>


              {/* Customer Selection */}
               <div className="card mb-4 mt-4">
                <div className="card-body">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        ref={searchCustomerRef}
                        type="text"
                        placeholder="Search Customers..."
                        value={searchCustomerTerm}
                        onChange={(e) => setSearchCustomerTerm(e.target.value)}
                        className="input pl-10"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="btn btn-primary"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Customer
                    </button>
                  </div>
                </div>
              </div>

               {/* Search Results */}
               <div className="card flex-1">
                <div className="card-header">
                  <h3 className="text-lg font-medium">Customers</h3>
                </div>
                <div className="card-body p-0 overflow-y-auto max-h-[400px]">
                    {customerList.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                      {customerList.map((customer) => (
                          <div
                            key={customer.clientId}
                            className="p-4 h-20 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] transition-transform transition-colors duration-200"
                            onClick={() => setSelectedCustomer(customer)}
                            style={{ transformOrigin: 'center' }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {customer.clientFirstName} {customer.clientLastName}
                                </h4>
                                <p className="text-sm text-gray-500">{customer.contactNumber}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        {searchCustomerTerm ? 'No customers found' : 'Search for customers'}
                      </div>
                    )}
                </div>
              </div>
            </div>

            

            {/* Right Panel - Cart & Invoice */}
            <div className="flex flex-col">
              {/* Cart */}
              <div className="card flex-1 overflow-hidden">
                <div className="card-header">
                  <h3 className="text-lg font-medium">Cart ({cart.length})</h3>
                </div>
                <div className="card-body p-0 overflow-y-auto">
                  {cart.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {cart.map((item) => (
                        <div key={item.grnItemsId} className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.productName}</h4>
                              <p className="text-xs text-gray-500">{item.productNumber}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId,item.grnItemsId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1,item.grnItemsId,item.productQty)}
                                className="btn btn-sm btn-outline w-8 h-8 p-0"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1,item.grnItemsId,item.productQty)}
                                className="btn btn-sm btn-outline w-8 h-8 p-0"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                LKR {item.total.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                @ {item.sellingPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Discount input */}
                          <div className="mt-2">
                            <input
                              type="number"
                              placeholder="Discount"
                              value={item.discount}
                              onChange={(e) => updateCartItemDiscount(
                                item.productId, 
                                Math.max(0, Math.min(parseFloat(e.target.value) || 0, item.sellingPrice))
                              )}
                              className="input input-sm w-full"
                              min="0"
                              max={item.sellingPrice}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Cart is empty
                    </div>
                  )}
                </div>
              </div>


              {/* Totals & Actions */}
              <div className="card mt-4">
                <div className="card-body">
                {selectedCustomer ? (
                      <div className="mb-4divide-y divide-gray-200 border-t">
                          <div key={selectedCustomer.clientId} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{selectedCustomer.clientFirstName}</h4>
                                <p className="text-xs text-gray-500">{selectedCustomer.clientLastName}</p>
                              </div>
                              <button
                                onClick={() => setSelectedCustomer(null)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 mb-2">
                        Customer is empty
                      </div>
                    )}
                  {/* VAT and Discount Controls */}
                  <div className="grid grid-cols-2 gap-2 mb-4 border-t">
                    <div>
                      <label className="block text-sm font-medium mb-1">VAT %</label>
                      <input
                        type="number"
                        value={vatPercentage}
                        onChange={(e) => setVatPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="input input-sm w-full"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Discount</label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="input input-sm w-full"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>LKR {totals.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>VAT ({vatPercentage}%):</span>
                      <span>LKR {totals.vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>-LKR {totals.discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>LKR {totals.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={createInvoice}
                      disabled={loading || cart.length === 0 }
                      className="btn btn-primary w-full"
                    >
                      {loading ? 'Processing...' : 'Create Invoice'}
                    </button>
                    <button
                      onClick={clearCart}
                      disabled={loading}
                      className="btn btn-outline w-full"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Customers</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2">
              {customerList.map((customer) => (
                <button
                  key={customer.clientId}
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowCustomerModal(false)
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded border"
                >
                  <p className="font-medium">
                    {customer.clientFirstName} {customer.clientLastName}
                  </p>
                  <p className="text-sm text-gray-500">{customer.contactNumber}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Customer</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit(onCustomerSubmit)} className="space-y-4">
              <FormField
                label="First Name"
                type="text"
                error={customerErrors.clientFirstName}
                required
                {...registerCustomer('clientFirstName')}
              />
              <FormField
                label="Last Name"
                type="text"
                error={customerErrors.clientLastName}
                required
                {...registerCustomer('clientLastName')}
              />
              <FormField
                label="Address"
                type="text"
                error={customerErrors.address}
                required
                {...registerCustomer('address')}
              />
              <FormField
                label="Contact Number"
                type="tel"
                error={customerErrors.contactNumber}
                required
                {...registerCustomer('contactNumber')}
              />
              <FormField
                label="Email"
                type="email"
                error={customerErrors.email}
                required
                {...registerCustomer('email')}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="btn btn-primary flex-1"
                >
                  {isSubmittingCustomer ? 'Adding...' : 'Add Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false)
                    resetCustomer()
                    setError(null)
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}