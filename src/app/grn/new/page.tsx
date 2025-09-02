'use client'

import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useGRN } from '../../hooks/useGRN'
import GRNFormSection from '../../components/grn/GRNFormSection'
import AddItemSection from '../../components/grn/AddItemSection'
import GRNSummary from '../../components/grn/GRNSummary'
import FinalizeSection from '../../components/grn/FinalizeSection'

export default function NewGRNPage() {
  const {
    suppliers,
    loadingSuppliers,
    items,
    grnNumber,
    supplierProducts,
    loadingProducts,
    paymentMethods,
    loadingPaymentMethods,
    selectedPaymentMethodId,
    filteredSuppliers,
    supplierSearchTerm,
    showSupplierDropdown,
    filteredProducts,
    productSearchTerm,
    showProductDropdown,
    selectedSupplier,
    totalCost,
    register,
    errors,
    supplierName,
    invoiceNumber,
    grnNote,
    handleSupplierSelect,
    handleProductSelect,
    handleAddItem,
    removeItem,
    handleCancelGRN,
    handleFinalizeGRN,
    setSupplierSearchTerm,
    setShowSupplierDropdown,
    setProductSearchTerm,
    setShowProductDropdown,
    setSelectedPaymentMethodId,
  } = useGRN()

  return (
    <ProtectedRoute allowedRoles={['admin', 'storekeeper']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Create New GRN"
            subtitle="Add new goods received note with items"
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <GRNFormSection
                grnNumber={grnNumber}
                selectedSupplier={selectedSupplier}
                onCancel={handleCancelGRN}
                register={register}
                errors={errors}
                supplierName={supplierName}
                invoiceNumber={invoiceNumber}
                grnNote={grnNote}
                loadingSuppliers={loadingSuppliers}
                supplierSearchTerm={supplierSearchTerm}
                showSupplierDropdown={showSupplierDropdown}
                filteredSuppliers={filteredSuppliers}
                onSupplierSearchChange={setSupplierSearchTerm}
                onSupplierFocus={() => setShowSupplierDropdown(true)}
                onSupplierSelect={handleSupplierSelect}
                loadingPaymentMethods={loadingPaymentMethods}
                selectedPaymentMethodId={selectedPaymentMethodId}
                paymentMethods={paymentMethods}
                onPaymentMethodChange={setSelectedPaymentMethodId}
              />

              <AddItemSection
                loadingProducts={loadingProducts}
                productSearchTerm={productSearchTerm}
                showProductDropdown={showProductDropdown}
                filteredProducts={filteredProducts}
                onProductSearchChange={setProductSearchTerm}
                onProductFocus={() => setShowProductDropdown(true)}
                onProductSelect={handleProductSelect}
                onAddItem={handleAddItem}
              />

              <GRNSummary
                grnNumber={grnNumber}
                invoiceNumber={invoiceNumber}
                selectedSupplier={selectedSupplier}
                items={items}
                totalCost={totalCost}
                onRemoveItem={removeItem}
              />

              <FinalizeSection
                onFinalize={handleFinalizeGRN}
                isDisabled={items.length === 0 || !supplierName || !invoiceNumber || !selectedPaymentMethodId}
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}