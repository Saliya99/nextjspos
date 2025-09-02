'use client'

import FormField from '../forms/FormField'
import { Product } from '../../types'

interface AddItemSectionProps {
  loadingProducts: boolean
  productSearchTerm: string
  showProductDropdown: boolean
  filteredProducts: Product[]
  onProductSearchChange: (value: string) => void
  onProductFocus: () => void
  onProductSelect: (product: Product) => void
  onAddItem: () => void
}

export default function AddItemSection({
  loadingProducts,
  productSearchTerm,
  showProductDropdown,
  filteredProducts,
  onProductSearchChange,
  onProductFocus,
  onProductSelect,
  onAddItem,
}: AddItemSectionProps) {
  return (
    <section className="mb-10 p-6 bg-blue-50 rounded-xl border border-blue-200">
      <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
          1
        </span>
        Add New Item
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative product-dropdown">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Item
          </label>
          {loadingProducts ? (
            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
          ) : (
            <>
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => onProductSearchChange(e.target.value)}
                onFocus={onProductFocus}
                placeholder="Search products..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.productId}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => onProductSelect(product)}
                      >
                        <div className="font-medium text-gray-900">{product.productName || 'Unnamed Product'}</div>
                        <div className="text-sm text-gray-500">{product.productNumber || 'No product number'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <FormField
          label="Cost Price (Rs) *"
          type="number"
          placeholder="Enter cost price"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <FormField
          label="Selling Price (Rs) *"
          type="number"
          placeholder="Enter selling price"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <FormField
          label="Quantity *"
          type="number"
          placeholder="Enter quantity"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        <FormField
          label="Reorder Margin"
          type="number"
          placeholder="Enter reorder margin"
          className="w-full p-3 border border-gray-300 rounded-lg"
        />

        <div className="flex items-end">
          <button
            onClick={onAddItem}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
          >
            Add Item
          </button>
        </div>
      </div>
    </section>
  )
} 