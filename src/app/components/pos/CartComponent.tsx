'use client'

import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { CartComponentProps } from '../../types'

export default function CartComponent({
  cart,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem
}: CartComponentProps) {
  return (
    <div className="card flex-1 overflow-hidden">
      <div className="card-header">
        <h3 className="text-base sm:text-sm font-small">Cart ({cart.length})</h3>
      </div>
      <div className="card-body p-0 overflow-y-auto max-h-[350px] sm:max-h-[350px] lg:max-h-[450px]">
        {cart.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">ITEM</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">QTY</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">PRICE</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-900 uppercase tracking-wider">ITEM DISCOUNT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">TOTAL</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cart.map((item) => (
                  <tr key={item.grnItemsId} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.productNumber}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.grnItemsId ?? 0,
                              item.productQty
                            )
                          }
                          className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
                          disabled={item.quantity <= 1}
                        >
                          <MinusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.grnItemsId ?? 0,
                              item.productQty
                            )
                          }
                          className="w-8 h-8 border border-gray-300 rounded bg-white hover:bg-gray-50 flex items-center justify-center transition-colors duration-200"
                        >
                          <PlusIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-sm text-gray-900">
                        LKR {item.sellingPrice.toFixed(2)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={item.discount > 0 ? item.discount : ''}
                        onChange={(e) =>
                          onUpdateDiscount(
                            item.productId,
                            Math.max(
                              0,
                              Math.min(
                                parseFloat(e.target.value) || 0,
                                item.sellingPrice
                              )
                            )
                          )
                        }
                        className="w-16 h-8 border border-gray-300 rounded bg-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max={item.sellingPrice}
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        LKR {item.total.toFixed(2)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onRemoveItem(item.productId, item.grnItemsId ?? 0)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm sm:text-base">
            Cart is empty
          </div>
        )}
      </div>
    </div>
  )
}
