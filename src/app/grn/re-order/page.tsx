'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import { apiClient } from '../../lib/api'
import { ReOrderItem, SortState } from '../../types'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function ReOrderPage() {
  const [reOrderItems, setReOrderItems] = useState<ReOrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [sortState, setSortState] = useState<SortState>({ sortBy: 'grn_items_id', sortOrder: 'desc' })

  const loadReOrderItems = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.getReOrderItems({
        page: currentPage,
        per_page: perPage,
        sort_by: sortState.sortBy,
        sort_order: sortState.sortOrder,
        paginate: true,
      })
      if (response.success) {
        setReOrderItems(response.data || [])
        setTotalRows(response.pagination?.total || 0)
      } else {
        setReOrderItems([])
        setTotalRows(0)
      }
    } catch {
      setReOrderItems([])
      setTotalRows(0)
    } finally { setLoading(false) }
  }, [currentPage, perPage, sortState])

  useEffect(() => { loadReOrderItems() }, [loadReOrderItems])

  const debouncedSearch = useCallback(async (searchValue: string) => {
    if (searchValue.trim()) {
      setLoading(true)
      try {
        const response = await apiClient.searchReOrderItems({
          searchTerm: searchValue,
          page: 1,
          per_page: perPage,
          sort_by: sortState.sortBy,
          sort_order: sortState.sortOrder,
          paginate: true,
        })
        if (response.success) {
          setReOrderItems(response.data || [])
          setTotalRows(response.pagination?.total || 0)
          setCurrentPage(1)
        } else {
          setReOrderItems([])
          setTotalRows(0)
        }
      } catch {
        setReOrderItems([])
        setTotalRows(0)
      } finally { setLoading(false) }
    } else {
      setCurrentPage(1)
      loadReOrderItems()
    }
  }, [perPage, sortState, loadReOrderItems])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    const timer = setTimeout(() => debouncedSearch(value), 500)
    return () => clearTimeout(timer)
  }

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handlePerRowsChange = (newPerPage: number, page: number) => { setPerPage(newPerPage); setCurrentPage(page) }
  const handleSort = (column: any, sortDirection: 'asc' | 'desc') => {
    setSortState({ sortBy: column.sortField || 'grn_items_id', sortOrder: sortDirection })
    setCurrentPage(1)
  }

  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown)
  }

  const closeExportDropdown = () => {
    setShowExportDropdown(false)
  }

  const fetchAllReOrderItems = async () => {
    const response = await apiClient.getReOrderItems({ paginate: false })
    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error('No re-order items to export')
    }
    return response.data.map((item: ReOrderItem) => ({
      'Name': item.product_name,
      'Barcode Number': item.product_number,
      'GRN Item ID': item.grn_items_id,
      'Available Quantity': item.current_quantity,
      'Reorder Quantity Margin': item.re_order_margin
    }))
  }

  const handleExport = async (
    exportFn: (data: any[], options: any) => Promise<void>,
    options: any,
    alertMsg = 'Failed to export re-order items. Please try again.'
  ) => {
    setIsExporting(true)
    try {
      const allData = await fetchAllReOrderItems()
      await exportFn(allData, options)
      toast.success('Export successful!')
    } catch (error) {
      if (error instanceof Error && error.message === 'No re-order items to export') {
        toast.error('No re-order items to export')
      } else {
        toast.error(alertMsg)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToCSV = async () => {
    await handleExport(exportToCSV, {
      filename: `reorder_items_${new Date().toISOString().split('T')[0]}.csv`,
    })
  }

  const handleExportToExcel = async () => {
    await handleExport(exportToExcel, {
      filename: `reorder_items_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'ReOrderItems',
    })
  }

  const columns = useMemo(() => [
    { 
      name: 'Name', 
      selector: (row: ReOrderItem) => row.product_name, 
      sortable: true, 
      sortField: 'product_name',
      wrap: true
    },
    { 
      name: 'Barcode Number', 
      selector: (row: ReOrderItem) => row.product_number, 
      sortable: true, 
      sortField: 'product_number'
    },
    { 
      name: 'GRN Item ID', 
      selector: (row: ReOrderItem) => row.grn_items_id, 
      sortable: true, 
      sortField: 'grn_items_id'
    },
    { 
      name: 'Available Quantity', 
      selector: (row: ReOrderItem) => row.current_quantity, 
      sortable: true, 
      sortField: 'current_quantity',
      cell: (row: ReOrderItem) => (
        <span className={`font-medium ${row.current_quantity === 0 ? 'text-red-600' : 'text-orange-600'}`}>
          {row.current_quantity}
        </span>
      )
    },
    { 
      name: 'Reorder Quantity Margin', 
      selector: (row: ReOrderItem) => row.re_order_margin, 
      sortable: true, 
      sortField: 're_order_margin'
    },
  ], [])

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header title="Re-order Items" subtitle="Items that need to be re-ordered based on re-order margin" />
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50 p-4 w-full">

          <div className="card mb-4 w-full">
            <div className="card-body flex flex-wrap gap-4 w-full">
              <div className="relative flex-1 min-w-[250px]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search re-order items by name or barcode..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input pl-10 w-full"
                  aria-label="Search re-order items"
                />
              </div>
            </div>
          </div>

          <div className="card w-full">
            <div className="card-header flex justify-between items-center w-full">
              <h3 className="text-lg font-medium text-gray-900">Re-order Items {totalRows > 0 ? `(${totalRows})` : ''}</h3>
              <div className="relative export-dropdown">
                <button
                  onClick={toggleExportDropdown}
                  className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 me-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4 text-gray-500 me-2" />
                      Export
                      <ChevronDownIcon className="w-3 h-3 ms-2" />
                    </>
                  )}
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 z-10 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-sm">
                    <ul className="p-3 space-y-1 text-sm text-gray-700">
                      <li>
                        <button
                          onClick={() => {
                            handleExportToCSV()
                            closeExportDropdown()
                          }}
                          disabled={isExporting}
                          className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 me-2 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Export to CSV
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            handleExportToExcel()
                            closeExportDropdown()
                          }}
                          disabled={isExporting}
                          className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 me-2 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Export to Excel
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body p-0 w-full">
              <DataTable
                columns={columns}
                data={reOrderItems}
                progressPending={loading}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                onSort={handleSort}
                sortServer
                highlightOnHover
                responsive
                customStyles={{
                  table: {
                    style: {
                      width: '100%',
                    },
                  },
                  headCells: {
                    style: {
                      backgroundColor: '#f9fafb',
                      fontWeight: '600',
                    },
                  },
                  cells: {
                    style: {
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                    },
                  },
                }}
                noDataComponent={
                  <div className="text-center py-12">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? 'No re-order items found' : 'No items need re-ordering'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'All items are above their re-order margin.'}
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}