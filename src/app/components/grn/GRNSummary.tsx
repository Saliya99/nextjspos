'use client'

import { Supplier, GRNItemWithTemp } from '../../types'

interface GRNSummaryProps {
  grnNumber: string
  invoiceNumber: string
  selectedSupplier?: Supplier
  items: GRNItemWithTemp[]
  totalCost: number
  onRemoveItem: (tempId: number) => void
}

export default function GRNSummary({
  grnNumber,
  invoiceNumber,
  selectedSupplier,
  items,
  totalCost,
  onRemoveItem,
}: GRNSummaryProps) {
  return (
    <section className="mb-10 p-6 bg-green-50 rounded-xl border border-green-200">
      <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
        <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
          2
        </span>
        GRN Summary & Items
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-3">GRN Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">GRN Number:</span>
                <span className="font-medium">{grnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-medium">{invoiceNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>

          {selectedSupplier && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-3">Supplier Info</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{selectedSupplier.supplier_name}</p>
                <p className="text-gray-600">{selectedSupplier.supplier_address}</p>
                <p className="text-gray-600">{selectedSupplier.supplier_contact_number}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500">Items Added</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center shadow-sm">
              <p className="text-sm text-gray-500">Total Cost (Rs)</p>
              <p className="text-2xl font-bold text-pink-600">{totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full text-sm text-left border border-gray-200">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Cost (Rs)</th>
              <th className="px-4 py-3">Selling (Rs)</th>
              <th className="px-4 py-3">Reorder Margin</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                  No items added yet. Start by adding an item above.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.tempId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{item.costPrice.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.sellingPrice.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.reorderMargin.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRemoveItem(item.tempId)}
                      className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
} 