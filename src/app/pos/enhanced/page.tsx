'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import ProtectedRoute from '../../components/ProtectedRoute'
import ProductSearch from '../../components/pos/ProductSearch'
import CustomerSearch from '../../components/pos/CustomerSearch'
import CartComponent from '../../components/pos/CartComponent'
import InvoiceSummary from '../../components/pos/InvoiceSummary'
import InvoiceModal from '../../components/pos/InvoiceModal'
import AddCustomerModal from '../../components/pos/AddCustomerModal'
import HoldInvoiceCard from '../../components/pos/HoldInvoiceCard'
import { usePOSLogic } from '../../hooks/usePOSLogic'
import { useSearch } from '../../hooks/useSearch'
import { customerSchema, CustomerFormData } from '../../lib/schemas'
import { apiClient } from '../../lib/api'

export default function EnhancedPOSPage() {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [currentInvoiceData, setCurrentInvoiceData] = useState(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchCustomerRef = useRef<HTMLInputElement>(null)

  const {
    cart,
    selectedCustomer,
    setSelectedCustomer,
    paymentMethods,
    setPaymentMethods,
    paymentMethodId,
    setPaymentMethodId,
    vatPercentage,
    setVatPercentage,
    discountPercentage,
    setDiscountPercentage,
    loading,
    addToCart,
    updateCartItemQuantity,
    updateCartItemDiscount,
    removeFromCart,
    calculateTotals,
    createInvoice,
    clearCart,
    holdInvoice,
    getInvoiceByIndex,
    restoreInvoiceToCart
  } = usePOSLogic()

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchCustomerTerm,
    setSearchCustomerTerm,
    customerList,
    searchProducts,
    getCustomers,
    paymentMethods: searchPaymentMethods
  } = useSearch()

  const {
    register: registerCustomer,
    handleSubmit: handleCustomerSubmit,
    reset: resetCustomer,
    formState: { errors: customerErrors, isSubmitting: isSubmittingCustomer }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })

  useEffect(() => {
    if (searchPaymentMethods.length > 0) {
      setPaymentMethods(searchPaymentMethods)
    }
  }, [searchPaymentMethods, setPaymentMethods])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProducts()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, searchProducts])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCustomerTerm.trim()) {
        getCustomers()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchCustomerTerm, getCustomers])

  const handleCreateInvoice = async () => {
    const invoiceData = await createInvoice()
    if (invoiceData) {
      setCurrentInvoiceData(invoiceData)
      setShowInvoiceModal(true)
    }
  }

  const handlePrint = () => {
    toast.success('Invoice printed successfully!')
  }

  const handleAddMore = () => {
    setShowInvoiceModal(false)
    setCurrentInvoiceData(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleHoldInvoice = () => {
    holdInvoice()
    setShowInvoiceModal(false)
    setCurrentInvoiceData(null)
  }

  const handleRestoreToCart = () => {
    if (currentInvoiceData) {
      restoreInvoiceToCart(currentInvoiceData)
    }
    setShowInvoiceModal(false)
    setCurrentInvoiceData(null)
  }

  const onCustomerSubmit = async (data: CustomerFormData) => {
    try {
      const response = await apiClient.addNewCustomer(data)
      if (response.success) {
        toast.success('Customer added successfully!')
        setShowAddCustomerModal(false)
        resetCustomer()
      } else {
        toast.error(response.message || 'Failed to add customer')
      }
    } catch {
      toast.error('Failed to add customer. Please try again.')
    }
  }

  const totals = calculateTotals()

  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Enhanced Point of Sale" 
            subtitle="Advanced POS with enhanced features" 
          />
          
          <main className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full max-w-7xl mx-auto">
              {/* Left Panel - Product & Customer Search */}
              <div className="xl:col-span-2 flex flex-col gap-4">
                <ProductSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchResults={searchResults}
                  onAddToCart={addToCart}
                  searchInputRef={searchInputRef}
                />

                <CustomerSearch
                  searchCustomerTerm={searchCustomerTerm}
                  setSearchCustomerTerm={setSearchCustomerTerm}
                  customerList={customerList}
                  onCustomerSelect={setSelectedCustomer}
                  onAddCustomer={() => setShowAddCustomerModal(true)}
                  searchCustomerRef={searchCustomerRef}
                />
              </div>

              {/* Right Panel - Cart & Invoice */}
              <div className="flex flex-col gap-4">
                <CartComponent
                  cart={cart}
                  onUpdateQuantity={updateCartItemQuantity}
                  onUpdateDiscount={updateCartItemDiscount}
                  onRemoveItem={removeFromCart}
                />

                <InvoiceSummary
                  selectedCustomer={selectedCustomer}
                  onRemoveCustomer={() => setSelectedCustomer(null)}
                  vatPercentage={vatPercentage}
                  setVatPercentage={setVatPercentage}
                  discountPercentage={discountPercentage}
                  setDiscountPercentage={setDiscountPercentage}
                  totals={totals}
                  paymentMethods={paymentMethods}
                  paymentMethodId={paymentMethodId}
                  setPaymentMethodId={setPaymentMethodId}
                  loading={loading}
                  cartLength={cart.length}
                  onCreateInvoice={handleCreateInvoice}
                  onHoldInvoice={handleHoldInvoice}
                  onClearCart={clearCart}
                />

                <HoldInvoiceCard onSelectInvoiceIndex={getInvoiceByIndex} />
              </div>
            </div>
          </main>
        </div>

        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onAddMore={handleAddMore}
          onPrint={handlePrint}
          invoiceData={currentInvoiceData}
          onHoldInvoice={handleHoldInvoice}
          onRestoreToCart={handleRestoreToCart}
        />

        <AddCustomerModal
          isOpen={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          onSubmit={onCustomerSubmit}
          register={registerCustomer}
          handleSubmit={handleCustomerSubmit}
          errors={customerErrors}
          isSubmitting={isSubmittingCustomer}
          onReset={resetCustomer}
        />
      </div>
    </ProtectedRoute>
  )
}