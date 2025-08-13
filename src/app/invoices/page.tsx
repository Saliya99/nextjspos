'use client'

import { useState, useEffect, useCallback } from 'react'
// import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import { apiClient } from '../lib/api'
import { Invoice } from '../types'
import { 
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface ApiInvoice {
  InvoiceId: number
  ClientId: number
  ClientName: string
  InvoiceDateTime: string
  Vat: number
  VatPrice: number
  Discount: number
  DiscountPrice: number
  GrandTotal: number
  Status: number
  UserId: number
}

export default function InvoicesPage() {
  // const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getInvoiceList()
      if (response.result && response.data) {
        const invoiceList = response.data.map((item: ApiInvoice) => ({
          invoiceId: item.InvoiceId,
          invoiceNumber: item.InvoiceId + 10000,
          clientId: item.ClientId,
          clientName: item.ClientName,
          invoiceDateTime: item.InvoiceDateTime,
          vat: item.Vat || 0,
          vatPrice: item.VatPrice || 0,
          discount: item.Discount || 0,
          discountPrice: item.DiscountPrice || 0,
          grandTotal: item.GrandTotal,
          status: item.Status,
          userId: item.UserId
        }))
        setInvoices(invoiceList)
      } else {
        setError('Failed to load invoices: Invalid response format')
      }
    } catch (error) {
      console.error('Failed to load invoices:', error)
      setError(`Failed to load invoices: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      return (
        invoice.clientName?.toLowerCase().includes(searchLower) ||
        invoice.invoiceNumber?.toString().includes(searchTerm)
    )})
  }, [invoices, searchTerm])

  const viewInvoice = async (invoiceId: number) => {
    try {
      const response = await apiClient.getInvoiceDetails(invoiceId)
      if (response.result) {
        alert(`Invoice #${invoiceId + 10000} details loaded successfully!`)
      } else {
        alert('Failed to load invoice details: Invalid response format')
      }
    } catch (error) {
      console.error('Failed to load invoice details:', error)
      alert(`Failed to load invoice details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Invoice Management" 
            subtitle="View and manage all invoices" 
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-red-600">Error Loading Invoices</h3>
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
          title="Invoice Management" 
          subtitle="View and manage all invoices" 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">
                Invoices ({filteredInvoices().length})
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
                        <tr key={invoice.invoiceId}>
                          <td className="table-cell font-medium">
                            #{invoice.invoiceNumber}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <DocumentTextIcon className="h-4 w-4 text-primary-600" />
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
                                LKR {(invoice.grandTotal - invoice.discountPrice).toLocaleString()}
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
                                onClick={() => viewInvoice(invoice.invoiceId)}
                                className="btn btn-sm btn-outline"
                                title="View Invoice"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                title="Print Invoice"
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
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'No invoices match your search.' : 'No invoices have been created yet.'}
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
                    <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Invoices
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
                    <DocumentTextIcon className="h-8 w-8 text-success-600" />
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
                    <DocumentTextIcon className="h-8 w-8 text-warning-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Revenue
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        LKR {invoices
                          .filter(invoice => invoice.status === 1)
                          .reduce((sum, invoice) => sum + (invoice.grandTotal - invoice.discountPrice), 0)
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
    </div>
  )
}