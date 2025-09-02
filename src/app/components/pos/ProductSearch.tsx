'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
// import { SearchProductResult } from '../../types'
import { ProductSearchProps } from '../../types'

export default function ProductSearch({
  searchTerm,
  setSearchTerm,
  searchResults,
  onAddToCart,
  searchInputRef
}: ProductSearchProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto mt-4 px-2 sm:px-2 lg:px-0">
      {/* Search Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="card flex-1">
        <div className="card-header">
          <h4 className="text-sm font-medium">PRODUCT</h4>
        </div>
        <div className="card-body p-0 overflow-y-auto max-h-[200px] sm:max-h-[100px] md:max-h-[250px]">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {searchResults.map((product, productIndex) => {
                if (!product.grnData || product.grnData.length === 0) {
                  return (
                    <div
                      key={`${product.productId}-no-grn`}
                      className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] transition-transform duration-200"
                      onClick={() => onAddToCart(product)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-900 sm:text-sm">
                            {product.productName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {product.productNumber} • {product.productLocation}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Qty: {product.productQty || 0}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-900 sm:text-sm">
                            LKR {product.productSelling?.toLocaleString() || 'N/A'}
                          </p>
                          {product.productCost && product.productCost !== product.productSelling && (
                            <p className="text-xs sm:text-sm text-gray-500 line-through">
                              LKR {product.productCost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                return product.grnData?.map((grnItem, grnIndex) => {
                  if (!grnItem.quantity || grnItem.quantity <= 0) {
                    const grnProduct = {
                      ...product,
                      grnData: [grnItem],
                      currentGrnItem: grnItem
                    }

                    return (
                      <div
                        key={`${product.productId}-${grnItem.grnItemsId}-${grnIndex}-zero`}
                        className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] transition-transform duration-200 opacity-60"
                        onClick={() => onAddToCart(grnProduct)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-900 sm:text-sm">
                              {product.productName}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {product.productNumber} • {product.productLocation}
                            </p>
                            <p className="text-xs sm:text-sm text-red-500 font-medium">
                              GRN #{grnItem.grnItemsId} • Out of stock
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-400 sm:text-sm">
                              LKR {grnItem.sellingPrice?.toLocaleString() || product.productSelling?.toLocaleString() || 'N/A'}
                            </p>
                            {(grnItem.costPrice || product.productCost) && (
                              <p className="text-xs sm:text-sm text-gray-400 line-through">
                                LKR {(grnItem.costPrice || product.productCost).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const grnProduct = {
                    ...product,
                    grnData: [grnItem],
                    currentGrnItem: grnItem
                  }

                  return (
                    <div
                      key={`${product.productId}-${grnItem.grnItemsId}-${grnIndex}`}
                      className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] transition-transform duration-200"
                      onClick={() => onAddToCart(grnProduct)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-900 sm:text-sm ">
                            {product.productName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {product.productNumber} • {product.productLocation}
                          </p>
                          <p className="text-xs sm:text-sm text-green-600 font-medium">
                            GRN #{grnItem.grnItemsId} • Available: {grnItem.quantity}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-900 sm:text-sm">
                            LKR {grnItem.sellingPrice.toLocaleString()}
                          </p>
                          {grnItem.costPrice && grnItem.costPrice !== grnItem.sellingPrice && (
                            <p className="text-xs sm:text-sm text-gray-500 line-through">
                              LKR {grnItem.costPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }).filter(Boolean)
              }).flat()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 sm:h-48 text-gray-500 text-sm sm:text-base">
              {searchTerm ? 'No products found' : 'Search for products to add to cart'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
