'use client'

import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { CustomerSearchProps } from '../../types'

export default function CustomerSearch({
  searchCustomerTerm,
  setSearchCustomerTerm,
  customerList,
  onCustomerSelect,
  onAddCustomer,
  searchCustomerRef
}: CustomerSearchProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-0 mt-4">
      {/* Customer Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchCustomerRef}
                type="text"
                placeholder="Search Customers..."
                value={searchCustomerTerm}
                onChange={(e) => setSearchCustomerTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            {/* Add Customer Button */}
            <button
              onClick={onAddCustomer}
              className="btn btn-primary flex items-center justify-center gap-1 sm:gap-2"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="card flex-1">
        <div className="card-header">
          <h3 className="text-sm font-medium">CUSTOMERS</h3>
        </div>
        <div className="card-body p-0 overflow-y-auto max-h-[150px] sm:max-h-[100px] lg:max-h-[150px]">
          {customerList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerList.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => onCustomerSelect(customer)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {customer.first_Name} {customer.last_Name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {customer.contactNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {customer.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 sm:h-24 text-gray-500 text-sm sm:text-base">
              {searchCustomerTerm ? 'No customers found' : 'Search for customers'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
