'use client'

import FormField from '../forms/FormField'
import { Supplier, PaymentMethod } from '../../types'

interface GRNFormSectionProps {
  grnNumber: string
  selectedSupplier?: Supplier
  onCancel: () => void
  
  register: any
  errors: any
  supplierName: string
  invoiceNumber: string
  grnNote: string
  
  loadingSuppliers: boolean
  supplierSearchTerm: string
  showSupplierDropdown: boolean
  filteredSuppliers: Supplier[]
  onSupplierSearchChange: (value: string) => void
  onSupplierFocus: () => void
  onSupplierSelect: (supplier: Supplier) => void
  
  loadingPaymentMethods: boolean
  selectedPaymentMethodId: number | null
  paymentMethods: PaymentMethod[]
  onPaymentMethodChange: (id: number | null) => void
}

export default function GRNFormSection({
  grnNumber,
  selectedSupplier,
  onCancel,
  register,
  errors,
  supplierName,
  invoiceNumber,
  grnNote,
  loadingSuppliers,
  supplierSearchTerm,
  showSupplierDropdown,
  filteredSuppliers,
  onSupplierSearchChange,
  onSupplierFocus,
  onSupplierSelect,
  loadingPaymentMethods,
  selectedPaymentMethodId,
  paymentMethods,
  onPaymentMethodChange,
}: GRNFormSectionProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          GRN: {grnNumber} | {selectedSupplier?.supplier_name || 'Select Supplier'}
        </h2>
        <button
          onClick={onCancel}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cancel GRN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="relative supplier-dropdown">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Supplier *
          </label>
          {loadingSuppliers ? (
            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
          ) : (
            <>
              <input
                type="text"
                value={supplierSearchTerm}
                onChange={(e) => onSupplierSearchChange(e.target.value)}
                onFocus={onSupplierFocus}
                placeholder="Search suppliers..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showSupplierDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.supplier_id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => onSupplierSelect(supplier)}
                      >
                        <div className="font-medium text-gray-900">{supplier.supplier_name}</div>
                        <div className="text-sm text-gray-500">{supplier.supplier_address}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">No suppliers found</div>
                  )}
                </div>
              )}
            </>
          )}
          {errors.supplierName && (
            <p className="text-red-500 text-sm mt-1">{errors.supplierName.message}</p>
          )}
        </div>

        <FormField
          label="Invoice Number *"
          type="text"
          error={errors.invoiceNumber}
          {...register('invoiceNumber')}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <FormField
          label="Received Date"
          type="date"
          error={errors.grnDate}
          {...register('grnDate')}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
          {loadingPaymentMethods ? (
            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
          ) : (
            <select
              value={selectedPaymentMethodId || ''}
              onChange={(e) => onPaymentMethodChange(Number(e.target.value) || null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.method}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Note (Optional)
          </label>
          <textarea
            {...register('grnNote')}
            placeholder="Enter any additional notes about this GRN..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={1}
          />
          {errors.grnNote && (
            <p className="text-red-500 text-sm mt-1">{errors.grnNote.message}</p>
          )}
        </div>
      </div>
    </>
  )
} 