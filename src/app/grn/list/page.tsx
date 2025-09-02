'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import { apiClient } from '../../lib/api'
import { GRN, SortState, GRNDetail } from '../../types'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
  UserIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

export default function GRNListPage() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [sortState, setSortState] = useState<SortState>({ sortBy: 'grn_detail_id', sortOrder: 'desc' })
  const [selectedGRN, setSelectedGRN] = useState<GRNDetail | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingGRN, setDeletingGRN] = useState<GRN | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getGRNDetails = async (grnId: number): Promise<GRNDetail> => {
    const response = await apiClient.getGRNDetails(grnId)
    if (!response.success) {
      throw new Error(response.message || 'Failed to load GRN details')
    }
    
    const data = response.data
    return {
      grnNumber: data.grn_number,
      invoiceNumber: data.grn.invoice_id,
      date: data.grn.grn_datetime,
      items: data.grn.items.map((item: any) => ({
        name: item.product?.product_name || 'N/A',
        product_number: item.product?.product_number || '-',
        quantity: item.qty,
        cost: item.cost_price
      })),
      supplierName: data.grn.supplier?.supplier_name || 'N/A',
      totalCost: data.total_cost
    }
  }

  const handleRowClick = async (row: GRN) => {
    try {
      setLoading(true)
      const details = await getGRNDetails(row.grn_id)
      setSelectedGRN(details)
      setShowModal(true)
    } catch (error) {
      toast.error('Failed to load GRN details')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('grn-print-content')
    if (printContent) {
      const printWindow = window.open('', '', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>GRN ${selectedGRN?.grnNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .grn-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                .grn-header { text-align: center; margin-bottom: 20px; }
                .grn-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .grn-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .grn-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .grn-items th, .grn-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .grn-items th { background-color: #f2f2f2; }
                .grn-total { text-align: right; font-weight: bold; font-size: 18px; }
                .grn-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
      }
    }
  }

  const loadGRNs = useCallback(async () => {
    setLoading(true)
    try {
      if (searchTerm.trim()) {
        const response = await apiClient.searchGRNs({
          searchTerm: searchTerm,
          page: currentPage,
          per_page: perPage,
          sort_by: sortState.sortBy,
          sort_order: sortState.sortOrder,
          paginate: true,
        })
        if (response.success) {
          setGrns(response.data || [])
          setTotalRows(response.pagination?.total || 0)
        } else {
          setGrns([])
          setTotalRows(0)
        }
      } else {
        const response = await apiClient.getGrnList({
          page: currentPage,
          per_page: perPage,
          sort_by: sortState.sortBy,
          sort_order: sortState.sortOrder,
          paginate: true,
        })
        if (response.success) {
          setGrns(response.data || [])
          setTotalRows(response.pagination?.total || 0)
        } else {
          setGrns([])
          setTotalRows(0)
        }
      }
    } catch {
      setGrns([])
      setTotalRows(0)
    } finally { setLoading(false) }
  }, [currentPage, perPage, sortState, searchTerm])

  useEffect(() => { loadGRNs() }, [loadGRNs])

  const debouncedSearch = useCallback(async (searchValue: string) => {
    if (searchValue.trim()) {
      setLoading(true)
      try {
        const response = await apiClient.searchGRNs({
          searchTerm: searchValue,
          page: 1,
          per_page: perPage,
          sort_by: sortState.sortBy,
          sort_order: sortState.sortOrder,
          paginate: true,
        })
        if (response.success) {
          setGrns(response.data || [])
          setTotalRows(response.pagination?.total || 0)
          setCurrentPage(1)
        } else {
          setGrns([])
          setTotalRows(0)
        }
      } catch {
        setGrns([])
        setTotalRows(0)
      } finally { setLoading(false) }
    } else {
      setCurrentPage(1)
      loadGRNs()
    }
  }, [perPage, sortState, loadGRNs])

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handlePerRowsChange = (newPerPage: number, page: number) => { setPerPage(newPerPage); setCurrentPage(page) }
  const handleSort = (column: any, sortDirection: 'asc' | 'desc') => {
    setSortState({ sortBy: column.sortField || 'grn_detail_id', sortOrder: sortDirection })
    setCurrentPage(1)
  }

  const openDeleteModal = (grn: GRN) => {
    setDeletingGRN(grn)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingGRN(null)
  }

  const handleDeleteGRN = async () => {
    if (!deletingGRN) return

    setIsDeleting(true)
    try {
      const response = await apiClient.deleteGRN(deletingGRN.grn_id)
      
      if (response.success) {
        toast.success(`GRN ${deletingGRN.grn_number} deleted successfully!`)
        closeDeleteModal()

        if (searchTerm.trim()) {
          debouncedSearch(searchTerm)
        } else {
          loadGRNs()
        }
      } else {
        toast.error(response.message || 'Failed to delete GRN')
      }
    } catch (error) {
      toast.error('An unexpected error occurred while deleting the GRN')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo(() => [
    { name: 'Date', selector: (row: GRN) => row.grn_date, sortable: true, sortField: 'grn_datetime' },
    { name: 'GRN Number', selector: (row: GRN) => row.grn_number, sortable: true, sortField: 'grn_detail_id' },
    { name: 'Supplier Name', selector: (row: GRN) => row.supplier_name, sortable: false },
    { name: 'Invoice Number', selector: (row: GRN) => row.invoice_number, sortable: true, sortField: 'invoice_id' },
    { name: 'Status', selector: (row: GRN) => row.status, sortable: true, sortField: 'status', cell: (row: GRN) => <span className="text-gray-900">{row.status === 1 ? 'Active' : 'Inactive'}</span> },
    {
      name: 'Actions',
      cell: (row: GRN) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleRowClick(row) }}
            className="btn btn-sm btn-outline"
            aria-label={`View GRN ${row.grn_number}`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDeleteModal(row) }}
            className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
            aria-label={`Delete GRN ${row.grn_number}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '120px',
      sortable: false,
    },
  ], [])

  const fetchAllGRNs = async () => {
    const response = await apiClient.getGrnList({ paginate: false })
    if (!response.success || !response.data || response.data.length === 0) {
      throw new Error('No GRNs to export')
    }
    return response.data.map((grn: GRN) => ({
      'ID': grn.grn_id,
      'Date': grn.grn_date,
      'GRN Number': grn.grn_number,
      'Supplier Name': grn.supplier_name,
      'Invoice Number': grn.invoice_number,
      'Status': grn.status === 1 ? 'Active' : 'Inactive'
    }))
  }

  const handleExport = async (
    exportFn: (data: any[], options: any) => Promise<void>,
    options: any,
    alertMsg = 'Failed to export GRNs. Please try again.'
  ) => {
    setIsExporting(true)
    try {
      const allData = await fetchAllGRNs()
      await exportFn(allData, options)
      toast.success('Export successful!')
    } catch (error) {
      if (error instanceof Error && error.message === 'No GRNs to export') {
        toast.error('No GRNs to export')
      } else {
        toast.error(alertMsg)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToCSV = async () => {
    await handleExport(exportToCSV, {
      filename: `grn_list_${new Date().toISOString().split('T')[0]}.csv`,
    })
  }

  const handleExportToExcel = async () => {
    await handleExport(exportToExcel, {
      filename: `grn_list_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'GRNList',
    })
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header title="Goods Received Note (GRN) List" subtitle="Manage your GRN database" />
        <main className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50 p-4 w-full">

          <div className="card mb-4 w-full">
            <div className="card-body flex flex-wrap gap-4 w-full">
              <div className="relative flex-1 min-w-[250px]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search GRNs by date or supplier..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchTerm(value)
                    const timer = setTimeout(() => debouncedSearch(value), 500)
                    return () => clearTimeout(timer)
                  }}
                  className="input pl-10 w-full"
                  aria-label="Search GRNs"
                />
              </div>
            </div>
          </div>

          <div className="card w-full">
            <div className="card-header flex justify-between items-center w-full">
              <h3 className="text-lg font-medium text-gray-900">GRN List {totalRows > 0 ? `(${totalRows})` : ''}</h3>
              <div className="relative export-dropdown">
                <button
                  onClick={() => setShowExportDropdown(prev => !prev)}
                  className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 me-2"></div> Exporting...</>
                  ) : (
                    <><ArrowDownTrayIcon className="w-4 h-4 text-gray-500 me-2" /> Export <ChevronDownIcon className="w-3 h-3 ms-2" /></>
                  )}
                </button>
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 z-10 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-sm">
                    <ul className="p-3 space-y-1 text-sm text-gray-700">
                      <li>
                        <button
                          onClick={() => { handleExportToCSV(); setShowExportDropdown(false) }}
                          disabled={isExporting}
                          className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 me-2 text-green-600" /> Export to CSV
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => { handleExportToExcel(); setShowExportDropdown(false) }}
                          disabled={isExporting}
                          className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 me-2 text-blue-600" /> Export to Excel
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body p-0 w-full overflow-x-auto">
              <DataTable
                columns={columns}
                data={grns}
                progressPending={loading}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                onChangePage={handlePageChange}
                onChangeRowsPerPage={handlePerRowsChange}
                sortServer
                onSort={handleSort}
                responsive
                highlightOnHover
                pointerOnHover
                noDataComponent={
                  <div className="text-center py-12">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? 'No GRNs found' : 'No GRNs available'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first GRN.'}
                    </p>
                  </div>
                }
                progressComponent={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-label="Loading GRNs"></div>
                  </div>
                }
                className="min-w-full"
                customStyles={{
                  table: { style: { width: '100%' } },
                  headCells: { style: { fontWeight: 'bold', fontSize: '14px', paddingLeft: '12px', paddingRight: '12px' } },
                  cells: { style: { fontSize: '13px', paddingLeft: '12px', paddingRight: '12px' } }
                }}
              />
            </div>
          </div>

          {showModal && selectedGRN && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl overflow-auto max-h-[90vh] p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">GRN Details: {selectedGRN.grnNumber}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div id="grn-print-content">
                  <div className="mb-4">
                    <p><strong>Invoice Number:</strong> {selectedGRN.invoiceNumber}</p>
                    <p><strong>Date:</strong> {selectedGRN.date}</p>
                    <p><strong>Supplier:</strong> {selectedGRN.supplierName}</p>
                  </div>
                  <table className="table-auto w-full border-collapse border border-gray-300 mb-4">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1">Name</th>
                        <th className="border border-gray-300 px-2 py-1">Barcode</th>
                        <th className="border border-gray-300 px-2 py-1">Quantity</th>
                        <th className="border border-gray-300 px-2 py-1">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGRN.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{item.name}</td>
                          <td className="border border-gray-300 px-2 py-1">{item.product_number}</td>
                          <td className="border border-gray-300 px-2 py-1">{item.quantity}</td>
                          <td className="border border-gray-300 px-2 py-1">{parseFloat(item.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-right font-bold">Total: {parseFloat(selectedGRN.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button onClick={handlePrint} className="btn btn-primary btn-sm">Print</button>
                  <button onClick={() => setShowModal(false)} className="btn btn-outline btn-sm">Close</button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && deletingGRN && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-red-600">
                    Delete GRN
                  </h3>
                  <button
                    onClick={closeDeleteModal}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close delete modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        Are you sure you want to delete this GRN?
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {deletingGRN.grn_number}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">
                      This action cannot be undone. The GRN will be permanently removed from your database.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteGRN}
                      disabled={isDeleting}
                      className="btn btn-danger flex-1"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete GRN'}
                    </button>
                    <button
                      onClick={closeDeleteModal}
                      disabled={isDeleting}
                      className="btn btn-outline flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
