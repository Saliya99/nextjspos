'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import { apiClient } from '../../lib/api'
import { Invoice } from '../../types'
import { toast } from 'react-hot-toast'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import { 
  UsersIcon,
  EyeIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0])
  const [isExporting, setIsExporting] = useState(false)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getInvoiceList()
      if (response.result && response.data) {
        const invoiceList = response.data.map((item: any) => ({
          invoice_id: item.invoice_id,
          invoiceNumber: item.invoice_id + 10000,
          id: item.customer_id,
          clientName: `${item.first_Name} ${item.last_Name}`,
          invoiceDateTime: item.invoice_setup_datetime,
          vat: item.vat || 0,
          vatPrice: item.vat_price || 0,
          discount: item.discount || 0,
          discountPrice: item.discount_price || 0,
          grandTotal: item.grand_total || 0,
          status: item.status,
          userId: item.user_id
        }))
        setInvoices(invoiceList)
      } else {
        setError('Failed to load customer invoices: Invalid response format')
      }
    } catch (error) {
      console.error('Failed to load customer invoices:', error)
      setError(`Failed to load customer invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="badge badge-warning">Draft</span>
      case 1:
        return <span className="badge badge-success">Completed</span>
      case 2:
        return <span className="badge badge-primary">Paid</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const filteredInvoices = useCallback(() => {
    const searchLower = searchTerm.toLowerCase()
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm || (
        invoice.clientName?.toLowerCase().includes(searchLower) ||
        invoice.invoiceNumber?.toString().includes(searchTerm)
      )
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && invoice.status === 1) ||
        (statusFilter === 'draft' && invoice.status === 0)
      
      const matchesDate = !dateFilter || 
        new Date(invoice.invoiceDateTime).toISOString().split('T')[0] === dateFilter
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [invoices, searchTerm, statusFilter, dateFilter])

  const viewInvoice = async (invoice_id: number) => {
    try {
      const response = await apiClient.getInvoiceDetails(invoice_id)
      if (response.result && response.data) {
        const invoice = response.data.invoice
        const items = response.data.items
        
        let details = `Customer Invoice #${invoice_id + 10000}\n`
        details += `Customer: ${invoice.first_Name} ${invoice.last_Name}\n`
        details += `Date: ${new Date(invoice.invoice_setup_datetime).toLocaleDateString()}\n`
        details += `Total: LKR ${invoice.grand_total?.toLocaleString()}\n`
        details += `Items: ${items.length}\n\n`
        
        items.forEach((item: any, index: number) => {
          details += `${index + 1}. ${item.product_name} - Qty: ${item.qty} - Price: LKR ${item.selling_price}\n`
        })
        
        alert(details)
      } else {
        alert('Failed to load invoice details: Invalid response format')
      }
    } catch (error) {
      console.error('Failed to load invoice details:', error)
      alert(`Failed to load invoice details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openDeleteModal = (invoice: Invoice) => {
    setDeletingInvoice(invoice)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setDeletingInvoice(null)
    setShowDeleteModal(false)
  }

  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return

    try {
      const response = await apiClient.deleteInvoice(deletingInvoice.invoice_id)
      if (response.result) {
        toast.success('Customer invoice deleted successfully!')
        closeDeleteModal()
        loadInvoices()
      } else {
        toast.error('Failed to delete invoice: ' + response.msg)
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      toast.error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const invoicesToExport = filteredInvoices()
      
      if (invoicesToExport.length === 0) {
        toast.error('No customer invoices to export')
        return
      }

      const csvData = invoicesToExport.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Customer': invoice.clientName,
        'Date': formatDate(invoice.invoiceDateTime),
        'Total Amount': invoice.grandTotal || 0,
        'Discount': invoice.discountPrice || 0,
        'VAT': invoice.vatPrice || 0,
        'Status': invoice.status === 1 ? 'Completed' : 'Draft'
      }))

      await exportToCSV(csvData, {
        filename: `customer_invoices_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success(`Successfully exported ${invoicesToExport.length} customer invoices to CSV`)
    } catch (error) {
      toast.error('Failed to export customer invoices. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const invoicesToExport = filteredInvoices()
      
      if (invoicesToExport.length === 0) {
        toast.error('No customer invoices to export')
        return
      }

      const excelData = invoicesToExport.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Customer': invoice.clientName,
        'Date': formatDate(invoice.invoiceDateTime),
        'Total Amount': invoice.grandTotal || 0,
        'Discount': invoice.discountPrice || 0,
        'VAT': invoice.vatPrice || 0,
        'Status': invoice.status === 1 ? 'Completed' : 'Draft'
      }))

      await exportToExcel(excelData, {
        filename: `customer_invoices_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Customer Invoices'
      })
      toast.success(`Successfully exported ${invoicesToExport.length} customer invoices to Excel`)
    } catch (error) {
      toast.error('Failed to export customer invoices. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const printInvoice = (invoice: Invoice) => {
    const printContent = `
      Customer Invoice #${invoice.invoiceNumber}
      Customer: ${invoice.clientName}
      Date: ${formatDate(invoice.invoiceDateTime)}
      Total: LKR ${invoice.grandTotal?.toLocaleString()}
      Status: ${invoice.status === 1 ? 'Completed' : 'Draft'}
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Customer Invoice #${invoice.invoiceNumber}</title></head>
          <body>
            <pre>${printContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Customer Invoices" 
            subtitle="View and manage customer invoices" 
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-red-600">Error Loading Customer Invoices</h3>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={loadInvoices}
                className="mt-4 btn btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Customer Invoices" 
          subtitle="View and manage customer invoices" 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* Header Actions */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customer invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
                
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="input"
                  placeholder="Filter by date"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setDateFilter(new Date().toISOString().split('T')[0])
                    }}
                    className="btn btn-outline flex-1"
                  >
                    Clear Filters
                  </button>
                  
                  <button
                    onClick={handleExportToCSV}
                    disabled={isExporting || filteredInvoices().length === 0}
                    className="btn btn-primary"
                    title="Export to CSV"
                  >
                    {isExporting ? '...' : 'CSV'}
                  </button>
                  
                  <button
                    onClick={handleExportToExcel}
                    disabled={isExporting || filteredInvoices().length === 0}
                    className="btn btn-primary"
                    title="Export to Excel"
                  >
                    {isExporting ? '...' : 'Excel'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Invoices Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Customer Invoices ({filteredInvoices().length})
              </h3>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredInvoices().length > 0 ? (
                <div className="overflow-hidden">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Invoice #</th>
                        <th className="table-header-cell">Customer</th>
                        <th className="table-header-cell">Date</th>
                        <th className="table-header-cell">Amount</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {filteredInvoices().map((invoice) => (
                        <tr key={invoice.invoice_id}>
                          <td className="table-cell font-medium">
                            #{invoice.invoiceNumber}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <UsersIcon className="h-4 w-4 text-primary-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {invoice.clientName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            {formatDate(invoice.invoiceDateTime)}
                          </td>
                          <td className="table-cell">
                            <div>
                              <div className="font-medium">
                                LKR {invoice.grandTotal?.toLocaleString() || '0'}
                              </div>
                              {invoice.discountPrice > 0 && (
                                <div className="text-sm text-gray-500">
                                  Discount: LKR {invoice.discountPrice.toLocaleString()}
                                </div>
                              )}
                              {invoice.vatPrice > 0 && (
                                <div className="text-sm text-gray-500">
                                  VAT: LKR {invoice.vatPrice.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="table-cell">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewInvoice(invoice.invoice_id)}
                                className="btn btn-sm btn-outline"
                                title="View Invoice"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => printInvoice(invoice)}
                                className="btn btn-sm btn-outline"
                                title="Print Invoice"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              {invoice.status !== 1 && (
                                <button
                                  onClick={() => openDeleteModal(invoice)}
                                  className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                                  title="Delete Invoice"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No customer invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No customer invoices match your search.' : 'No customer invoices have been created yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Customer Invoices
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {invoices.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-success-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {invoices.filter(invoice => invoice.status === 1).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-warning-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Customer Revenue
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        LKR {invoices
                          .filter(invoice => invoice.status === 1)
                          .reduce((sum, invoice) => sum + (invoice.grandTotal || 0), 0)
                          .toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Customer Invoice
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete Customer Invoice #{deletingInvoice.invoiceNumber}?
                  <br />
                  Customer: {deletingInvoice.clientName}
                  <br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={closeDeleteModal}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvoice}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}