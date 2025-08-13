'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import FormField from '../components/forms/FormField'
import { apiClient } from '../lib/api'
import { Customer } from '../types'
import { customerSchema, CustomerFormData } from '../lib/schemas'
import { exportToCSV, exportToExcel } from '../lib/exportService'
import {
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

interface SortState {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      clientFirstName: '',
      clientLastName: '',
      email: '',
      contactNumber: '',
      address: '',
      companyName: '',
      clientType: '',
      nic: ''
    }
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [sortState, setSortState] = useState<SortState>({
    sortBy: 'id',
    sortOrder: 'asc'
  })
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAllCustomers({
        page: currentPage,
        per_page: perPage,
        sort_by: sortState.sortBy,
        sort_order: sortState.sortOrder,
        paginate: true
      })

      if (response.success) {
        setCustomers(response.data)
        setTotalRows(response.pagination.total)
      } else {
        setCustomers([])
        setTotalRows(0)
      }
    } catch {
      setCustomers([])
      setTotalRows(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, sortState])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showExportDropdown && !target.closest('.export-dropdown')) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportDropdown])

  const debouncedSearch = useCallback(async (searchValue: string) => {
    if (searchValue.trim()) {
      setLoading(true)
      try {
        const response = await apiClient.searchCustomers(searchValue, {
          page: 1,
          per_page: perPage,
          sort_by: sortState.sortBy,
          sort_order: sortState.sortOrder
        })

        if (response.success) {
          setCustomers(response.data)
          setTotalRows(response.pagination.total)
          setCurrentPage(1)
        } else {
          setCustomers([])
          setTotalRows(0)
        }
      } catch {
        setCustomers([])
        setTotalRows(0)
      } finally {
        setLoading(false)
      }
    } else {
      setCurrentPage(1)
      loadCustomers()
    }
  }, [perPage, sortState.sortBy, sortState.sortOrder, loadCustomers])

  const onSubmit = async (data: CustomerFormData) => {
    try {
      let response

      if (editingCustomer) {
        response = await apiClient.updateCustomer(editingCustomer.clientId, data)
      } else {
        response = await apiClient.addNewCustomer(data)
      }

      if (response.success) {
        toast.success(editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!')
        setShowModal(false)
        resetForm()

        if (searchTerm.trim()) {
          debouncedSearch(searchTerm)
        } else {
          loadCustomers()
        }
      } else {
        toast.error(response.message || 'Failed to save customer')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  const resetForm = () => {
    reset()
    setEditingCustomer(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = useCallback((customer: Customer) => {
    setValue('clientFirstName', customer.clientFirstName)
    setValue('clientLastName', customer.clientLastName)
    setValue('email', customer.email || '')
    setValue('contactNumber', customer.contactNumber || '')
    setValue('address', customer.address || '')
    setEditingCustomer(customer)
    setShowModal(true)
  }, [setValue])

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const openDeleteModal = (customer: Customer) => {
    setDeletingCustomer(customer)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingCustomer(null)
  }

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return

    setIsDeleting(true)
    try {
      const response = await apiClient.deleteCustomer(deletingCustomer.clientId)

      if (response.success) {
        toast.success('Customer deleted successfully!')
        closeDeleteModal()

        if (searchTerm.trim()) {
          debouncedSearch(searchTerm)
        } else {
          loadCustomers()
        }
      } else {
        toast.error(response.message || 'Failed to delete customer')
      }
    } catch {
      toast.error('An unexpected error occurred while deleting the customer')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = useMemo(() => [
    {
      name: 'ID',
      selector: (row: Customer) => row.clientId,
      sortable: true,
      sortField: 'id',
      cell: (row: Customer) => (
        <span className="font-mono text-sm text-gray-900">{row.clientId}</span>
      ),
      width: '80px',
    },
    {
      name: 'Customer',
      selector: (row: Customer) => `${row.clientFirstName} ${row.clientLastName}`,
      sortable: true,
      sortField: 'first_name',
      cell: (row: Customer) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">
              {row.clientFirstName} {row.clientLastName}
            </div>
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Contact',
      selector: (row: Customer) => row.contactNumber || '',
      sortable: true,
      sortField: 'contact_no',
      cell: (row: Customer) => (
        <span className="text-gray-900">{row.contactNumber || '-'}</span>
      ),
      width: '150px',
    },
    {
      name: 'Email',
      selector: (row: Customer) => row.email || '',
      sortable: true,
      sortField: 'email',
      cell: (row: Customer) => (
        <span className="text-gray-900">{row.email || '-'}</span>
      ),
      width: '200px',
    },
    {
      name: 'Address',
      selector: (row: Customer) => row.address || '',
      sortable: true,
      sortField: 'address',
      cell: (row: Customer) => (
        <span className="text-gray-900 truncate max-w-xs block" title={row.address || ''}>
          {row.address || '-'}
        </span>
      ),
      width: '250px',
    },
       {
      name: 'Actions',
      cell: (row: Customer) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="btn btn-sm btn-outline"
            aria-label={`Edit customer ${row.clientFirstName} ${row.clientLastName}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
            aria-label={`Delete customer ${row.clientFirstName} ${row.clientLastName}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '120px',
      sortable: false,
    },
  ], [openEditModal])

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.getAllCustomers({
        paginate: false
      })

      if (!response.success || !response.data || response.data.length === 0) {
        toast.error('No customers to export')
        return
      }

      const allCustomers = response.data

      const csvData = allCustomers.map(customer => ({
        'First Name': customer.clientFirstName,
        'Last Name': customer.clientLastName,
        'Address': customer.address || '',
        'Contact Number': customer.contactNumber || '',
        'Email': customer.email || ''
      }))

      await exportToCSV(csvData, {
        filename: `customers_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success(`Successfully exported ${allCustomers.length} customers to CSV`)
    } catch {
      toast.error('Failed to export customers. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.getAllCustomers({
        paginate: false
      })

      if (!response.success || !response.data || response.data.length === 0) {
        toast.error('No customers to export')
        return
      }

      const allCustomers = response.data

      const excelData = allCustomers.map(customer => ({
        'First Name': customer.clientFirstName,
        'Last Name': customer.clientLastName,
        'Address': customer.address || '',
        'Contact Number': customer.contactNumber || '',
        'Email': customer.email || ''
      }))

      await exportToExcel(excelData, {
        filename: `customers_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Customers'
      })
      toast.success(`Successfully exported ${allCustomers.length} customers to Excel`)
    } catch {
      toast.error('Failed to export customers. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown)
  }

  const closeExportDropdown = () => {
    setShowExportDropdown(false)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePerRowsChange = (newPerPage: number, page: number) => {
    setPerPage(newPerPage)
    setCurrentPage(page)
  }

  const handleSort = (column: any, sortDirection: 'asc' | 'desc') => {
    const newSortBy = column.sortField || 'id'
    setSortState({
      sortBy: newSortBy,
      sortOrder: sortDirection
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Customer Management"
          subtitle="Manage your customer database"
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="card mb-6">
            <div className="card-body">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchTerm(value)
                      const timer = setTimeout(() => debouncedSearch(value), 500)
                      return () => clearTimeout(timer)
                    }}
                    className="input pl-10 w-full"
                    aria-label="Search customers"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="btn btn-primary"
                  aria-label="Add new customer"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Customer
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Customers {totalRows > 0 ? `(${totalRows})` : ''}
                </h3>
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
            </div>
            <div className="card-body p-0">
              <DataTable
                columns={columns}
                data={customers}
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
                      {searchTerm ? 'No customers found' : 'No customers available'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'Get started by adding your first customer.'
                      }
                    </p>
                  </div>
                }
                progressComponent={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-label="Loading customers"></div>
                  </div>
                }
              />
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="First Name"
                type="text"
                error={errors.clientFirstName}
                required
                {...register('clientFirstName')}
              />
              <FormField
                label="Last Name"
                type="text"
                error={errors.clientLastName}
                required
                {...register('clientLastName')}
              />
              <FormField
                label="Address"
                type="text"
                error={errors.address}
                required
                {...register('address')}
              />
              <FormField
                label="Contact Number"
                type="tel"
                error={errors.contactNumber}
                required
                {...register('contactNumber')}
              />
              <FormField
                label="Email"
                type="email"
                error={errors.email}
                required
                {...register('email')}
              />
              <FormField
                label="Company Name"
                type="text"
                error={errors.companyName}
                {...register('companyName')}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1"
                >
                  {isSubmitting ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deletingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-600">
                Delete Customer
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
                    <UserIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Are you sure you want to delete this customer?
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {deletingCustomer.clientFirstName} {deletingCustomer.clientLastName}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">
                  This action cannot be undone. The customer will be permanently removed from your database.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Customer'}
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

      {showDeleteModal && deletingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-600">
                Delete Customer
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
                    <UserIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Are you sure you want to delete this customer?
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {deletingCustomer.clientFirstName} {deletingCustomer.clientLastName}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">
                  This action cannot be undone. The customer will be permanently removed from your database.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Customer'}
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
    </div>
  )
}