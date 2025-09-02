'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { Customer, InvoiceCalculation, PaymentMethod } from '../../types'
import { InvoiceSummaryProps } from '../../types'

export default function InvoiceSummary({
  selectedCustomer,
  onRemoveCustomer,
  vatPercentage,
  setVatPercentage,
  discountPercentage,
  setDiscountPercentage,
  totals,
  paymentMethods,
  paymentMethodId,
  setPaymentMethodId,
  loading,
  cartLength,
  onCreateInvoice,
  onHoldInvoice,
  onClearCart
}: InvoiceSummaryProps) {
  return (
    <div className="card mt-2">
      <div className="card-body space-y-2 p-4">
        {/* Customer Info */}
        {selectedCustomer ? (
          <div className="rounded-lg border border-gray-200 p-2 sm:p-2 flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-small text-sm sm:text-sm truncate">
                {selectedCustomer.first_Name} {selectedCustomer.last_Name}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Customer ID: {selectedCustomer.id}
              </p>
            </div>
            <button
              onClick={onRemoveCustomer}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 text-gray-500 text-sm sm:text-base">
            No customer selected
          </div>
        )}

        {/* VAT and Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t pt-2">
          <div>
            <label className="block text-sm sm:text-sm font-small mb-1">
              VAT %
            </label>
            <input
              type="number"
              value={vatPercentage || ''}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setVatPercentage(0)
                } else {
                  const numValue = parseFloat(value)
                  if (!isNaN(numValue) && numValue >= 0) {
                    setVatPercentage(numValue)
                  }
                }
              }}
              className="input input-sm w-full"
              min="0"
              step="0.01"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-sm font-small mb-1">
              Subtotal Discount %
            </label>
            <input
              type="number"
              value={discountPercentage || ''}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  setDiscountPercentage(0)
                } else {
                  const numValue = parseFloat(value)
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    setDiscountPercentage(numValue)
                  }
                }
              }}
              className="input input-sm w-full"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between text-sm sm:text-sm">
            <span>Subtotal:</span>
            <span>LKR {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-sm">
            <span>Discount ({discountPercentage}%):</span>
            <span>-LKR {totals.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-sm">
            <span>VAT ({vatPercentage}%):</span>
            <span>LKR {totals.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base sm:text-ml border-t pt-2">
            <span>Total:</span>
            <span className="text-blue-600">
              LKR {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t pt-3">
          <label className="block text-xs sm:text-sm font-small mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethodId ?? ''}
            onChange={e => setPaymentMethodId(Number(e.target.value))}
            className="input w-full transition-all duration-300 focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.5)] focus:border-blue-500"
            style={{ transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>{method.method}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-2 border-t pt-2">
          <button
            onClick={onCreateInvoice}
            disabled={loading || cartLength === 0 || !paymentMethodId}
            className="btn btn-primary w-full text-sm sm:text-small"
          >
            {loading ? 'Processing...' : 'Generate Invoice'}
          </button>
          <button
            onClick={onHoldInvoice}
            disabled={loading || cartLength === 0}
            className="btn btn-warning w-full text-sm sm:text-small"
          >
            {loading ? 'Processing...' : 'Hold Invoice'}
          </button>
          <button
            onClick={onClearCart}
            disabled={loading}
            className="btn btn-outline w-full text-sm sm:text-small"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}
