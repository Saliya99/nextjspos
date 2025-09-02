'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import { apiClient } from '../../lib/api'
import { toast } from 'react-hot-toast'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import { 
  TruckIcon,
  EyeIcon,
  PrinterIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface SupplierInvoice {
  grnDetailId: number
  supplierId: number
  supplierName: string
  invoice_id: string
  grnId: number
  goodsReceivedDate: string
  note: string
  status: number
  paymentType: string
  grnDateTime: string
  supplierAddress: string
  supplierContactNumber: string
}

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0])
  const [isExporting, setIsExporting] = useState(false)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getGrnList()
      if (response.result && response.data) {
        const supplierInvoiceList = response.data.map((item: any) => ({
          grnDetailId: item.grn_detail_id,
          supplierId: item.supplier_id,
          supplierName: item.supplier_name,
          invoice_id: item.invoice_id,
          grnId: item.grn_id,
          goodsReceivedDate: item.goods_received_date,
          note: item.note,
          status: item.status,
          paymentType: item.payment_type,
          grnDateTime: item.grn_datetime,
          supplierAddress: item.supplier_address,
          supplierContactNumber: item.supplier_contact_number
        }))
        setInvoices(supplierInvoiceList)
      } else {
        setError('Failed to load supplier invoices: Invalid response format')
      }
    } catch (error) {
      console.error('Failed to load supplier invoices:', error)
      setError(`Failed to load supplier invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        invoice.supplierName?.toLowerCase().includes(searchLower) ||
        invoice.grnId?.toString().includes(searchTerm) ||
        invoice.invoice_id?.toString().includes(searchTerm)
      )
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && invoice.status === 1) ||
        (statusFilter === 'draft' && invoice.status === 0)
      
      const matchesDate = !dateFilter || 
        new Date(invoice.grnDateTime || invoice.goodsReceivedDate).toISOString().split('T')[0] === dateFilter
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [invoices, searchTerm, statusFilter, dateFilter])

  const viewInvoice = (invoice: SupplierInvoice) => {
    let details = `Supplier GRN #${invoice.grnId}\n`
    details += `Supplier: ${invoice.supplierName}\n`
    details += `Date: ${formatDate(invoice.grnDateTime || invoice.goodsReceivedDate)}\n`
    details += `Payment Type: ${invoice.paymentType || 'N/A'}\n`
    details += `Status: ${invoice.status === 1 ? 'Completed' : 'Draft'}\n`
    details += `Note: ${invoice.note || 'No notes'}\n`
    details += `Address: ${invoice.supplierAddress || 'N/A'}\n`
    details += `Contact: ${invoice.supplierContactNumber || 'N/A'}\n`
    
    alert(details)
  }

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const invoicesToExport = filteredInvoices()
      
      if (invoicesToExport.length === 0) {
        toast.error('No supplier invoices to export')
        return
      }

      const csvData = invoicesToExport.map(invoice => ({
        'GRN Number': invoice.grnId,
        'Invoice ID': invoice.invoice_id,
        'Supplier': invoice.supplierName,
        'Date': formatDate(invoice.grnDateTime || invoice.goodsReceivedDate),
        'Payment Type': invoice.paymentType || 'N/A',
        'Status': invoice.status === 1 ? 'Completed' : 'Draft',
        'Note': invoice.note || 'No notes'
      }))

      await exportToCSV(csvData, {
        filename: `supplier_invoices_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success(`Successfully exported ${invoicesToExport.length} supplier invoices to CSV`)
    } catch (error) {
      toast.error('Failed to export supplier invoices. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const invoicesToExport = filteredInvoices()
      
      if (invoicesToExport.length === 0) {
        toast.error('No supplier invoices to export')
        return
      }

      const excelData = invoicesToExport.map(invoice => ({
        'GRN Number': invoice.grnId,
        'Invoice ID': invoice.invoice_id,
        'Supplier': invoice.supplierName,
        'Date': formatDate(invoice.grnDateTime || invoice.goodsReceivedDate),
        'Payment Type': invoice.paymentType || 'N/A',
        'Status': invoice.status === 1 ? 'Completed' : 'Draft',
        'Note': invoice.note || 'No notes'
      }))

      await exportToExcel(excelData, {
        filename: `supplier_invoices_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Supplier Invoices'
      })
      toast.success(`Successfully exported ${invoicesToExport.length} supplier invoices to Excel`)
    } catch (error) {
      toast.error('Failed to export supplier invoices. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const printInvoice = (invoice: SupplierInvoice) => {
    const printContent = `
      Supplier GRN #${invoice.grnId}
      Supplier: ${invoice.supplierName}
      Date: ${formatDate(invoice.grnDateTime || invoice.goodsReceivedDate)}
      Payment Type: ${invoice.paymentType || 'N/A'}
      Status: ${invoice.status === 1 ? 'Completed' : 'Draft'}
      Note: ${invoice.note || 'No notes'}
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Supplier GRN #${invoice.grnId}</title></head>
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
            title="Supplier Invoices" 
            subtitle="View and manage supplier invoices" 
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-red-600">Error Loading Supplier Invoices</h3>
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
          title="Supplier Invoices" 
          subtitle="View and manage supplier invoices" 
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
                    placeholder="Search supplier invoices..."
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

          {/* Supplier Invoices Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Supplier Invoices ({filteredInvoices().length})
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
                        <th className="table-header-cell">GRN #</th>
                        <th className="table-header-cell">Supplier</th>
                        <th className="table-header-cell">Date</th>
                        <th className="table-header-cell">Payment Type</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {filteredInvoices().map((invoice) => (
                        <tr key={invoice.grnDetailId}>
                          <td className="table-cell font-medium">
                            #{invoice.grnId}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <TruckIcon className="h-4 w-4 text-primary-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">
                                  {invoice.supplierName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {invoice.note || 'No notes'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            {formatDate(invoice.grnDateTime || invoice.goodsReceivedDate)}
                          </td>
                          <td className="table-cell">
                            <span className="capitalize">
                              {invoice.paymentType || 'N/A'}
                            </span>
                          </td>
                          <td className="table-cell">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="table-cell">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewInvoice(invoice)}
                                className="btn btn-sm btn-outline"
                                title="View GRN"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => printInvoice(invoice)}
                                className="btn btn-sm btn-outline"
                                title="Print GRN"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No supplier invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No supplier invoices match your search.' : 'No supplier invoices have been created yet.'}
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
                    <TruckIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total GRNs
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
                    <TruckIcon className="h-8 w-8 text-success-600" />
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
                    <TruckIcon className="h-8 w-8 text-warning-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Suppliers
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {new Set(invoices.map(invoice => invoice.supplierId)).size}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}