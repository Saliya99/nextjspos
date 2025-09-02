'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import FormField from '../../components/forms/FormField'
import ProtectedRoute from '../../components/ProtectedRoute'
import { FixedAsset } from '../../types/far'
import { assetSchema, AssetFormData } from '../../lib/schemas/far'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'

const mockAssets: FixedAsset[] = [
  {
    id: 1,
    description: 'Dell Laptop Computer',
    serialNumber: 'DL001234',
    dateOfPurchase: '2023-01-15',
    cost: 85000,
    location: 'IT Department',
    accumulatedDepreciation: 17000,
    writtenDownValue: 68000,
    source: 'Purchase',
    supplier: 'Tech Solutions Ltd',
    ownership: 'Owned',
    category: 'Computer Equipment',
    status: 'Active',
    depreciationRate: 20,
    usefulLife: 5,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    description: 'Office Desk - Executive',
    serialNumber: 'FUR002',
    dateOfPurchase: '2022-06-10',
    cost: 25000,
    location: 'Admin Office',
    accumulatedDepreciation: 8333,
    writtenDownValue: 16667,
    source: 'Purchase',
    supplier: 'Office Furniture Co',
    ownership: 'Owned',
    category: 'Furniture',
    status: 'Active',
    depreciationRate: 10,
    usefulLife: 10,
    createdAt: '2022-06-10T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

const assetCategories = [
  'Computer Equipment',
  'Furniture',
  'Vehicles',
  'Machinery',
  'Building',
  'Office Equipment'
]

export default function AssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>(mockAssets)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<FixedAsset | null>(null)
  const [viewingAsset, setViewingAsset] = useState<FixedAsset | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      description: '',
      serialNumber: '',
      dateOfPurchase: '',
      cost: '',
      location: '',
      source: '',
      supplier: '',
      ownership: 'Owned',
      category: '',
      depreciationRate: '',
      usefulLife: ''
    }
  })

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets
    return assets.filter(asset =>
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [assets, searchTerm])

  const onSubmit = async (data: AssetFormData) => {
    try {
      const newAsset: FixedAsset = {
        id: editingAsset ? editingAsset.id : Date.now(),
        description: data.description,
        serialNumber: data.serialNumber,
        dateOfPurchase: data.dateOfPurchase,
        cost: Number(data.cost),
        location: data.location,
        source: data.source,
        supplier: data.supplier,
        ownership: data.ownership,
        category: data.category,
        depreciationRate: Number(data.depreciationRate),
        usefulLife: Number(data.usefulLife),
        accumulatedDepreciation: editingAsset ? editingAsset.accumulatedDepreciation : 0,
        writtenDownValue: editingAsset ? editingAsset.writtenDownValue : Number(data.cost),
        status: editingAsset ? editingAsset.status : 'Active',
        createdAt: editingAsset ? editingAsset.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingAsset) {
        setAssets(prev => prev.map(asset => asset.id === editingAsset.id ? newAsset : asset))
        toast.success('Asset updated successfully!')
      } else {
        setAssets(prev => [...prev, newAsset])
        toast.success('Asset added successfully!')
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error('Failed to save asset. Please try again.')
    }
  }

  const resetForm = () => {
    reset()
    setEditingAsset(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (asset: FixedAsset) => {
    setValue('description', asset.description)
    setValue('serialNumber', asset.serialNumber)
    setValue('dateOfPurchase', asset.dateOfPurchase)
    setValue('cost', asset.cost.toString())
    setValue('location', asset.location)
    setValue('source', asset.source)
    setValue('supplier', asset.supplier)
    setValue('ownership', asset.ownership)
    setValue('category', asset.category)
    setValue('depreciationRate', asset.depreciationRate.toString())
    setValue('usefulLife', asset.usefulLife.toString())
    setEditingAsset(asset)
    setShowModal(true)
  }

  const openViewModal = (asset: FixedAsset) => {
    setViewingAsset(asset)
    setShowViewModal(true)
  }

  const openDeleteModal = (asset: FixedAsset) => {
    setDeletingAsset(asset)
    setShowDeleteModal(true)
  }

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return

    setIsDeleting(true)
    try {
      setAssets(prev => prev.filter(asset => asset.id !== deletingAsset.id))
      toast.success('Asset deleted successfully!')
      setShowDeleteModal(false)
      setDeletingAsset(null)
    } catch (error) {
      toast.error('Failed to delete asset')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredAssets.map(asset => ({
        'Description': asset.description,
        'Serial Number': asset.serialNumber,
        'Date of Purchase': asset.dateOfPurchase,
        'Cost (LKR)': asset.cost,
        'Location': asset.location,
        'Accumulated Depreciation': asset.accumulatedDepreciation,
        'Written Down Value': asset.writtenDownValue,
        'Source': asset.source,
        'Supplier': asset.supplier,
        'Ownership': asset.ownership,
        'Category': asset.category,
        'Status': asset.status
      }))

      await exportToCSV(csvData, {
        filename: `fixed_assets_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success('Assets exported to CSV successfully!')
    } catch (error) {
      toast.error('Failed to export assets')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const excelData = filteredAssets.map(asset => ({
        'Description': asset.description,
        'Serial Number': asset.serialNumber,
        'Date of Purchase': asset.dateOfPurchase,
        'Cost (LKR)': asset.cost,
        'Location': asset.location,
        'Accumulated Depreciation': asset.accumulatedDepreciation,
        'Written Down Value': asset.writtenDownValue,
        'Source': asset.source,
        'Supplier': asset.supplier,
        'Ownership': asset.ownership,
        'Category': asset.category,
        'Status': asset.status
      }))

      await exportToExcel(excelData, {
        filename: `fixed_assets_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Fixed Assets'
      })
      toast.success('Assets exported to Excel successfully!')
    } catch (error) {
      toast.error('Failed to export assets')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="badge badge-success">Active</span>
      case 'Disposed':
        return <span className="badge badge-danger">Disposed</span>
      case 'Under Maintenance':
        return <span className="badge badge-warning">Under Maintenance</span>
      default:
        return <span className="badge badge-secondary">{status}</span>
    }
  }

  const columns = useMemo(() => [
    {
      name: 'Asset',
      selector: (row: FixedAsset) => row.description,
      sortable: true,
      cell: (row: FixedAsset) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{row.description}</div>
            <div className="text-sm text-gray-500">{row.serialNumber}</div>
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Cost (LKR)',
      selector: (row: FixedAsset) => row.cost,
      sortable: true,
      cell: (row: FixedAsset) => (
        <span className="font-medium text-gray-900">
          {row.cost.toLocaleString()}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'WDV (LKR)',
      selector: (row: FixedAsset) => row.writtenDownValue,
      sortable: true,
      cell: (row: FixedAsset) => (
        <span className="font-medium text-green-600">
          {row.writtenDownValue.toLocaleString()}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'Location',
      selector: (row: FixedAsset) => row.location,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Category',
      selector: (row: FixedAsset) => row.category,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Status',
      selector: (row: FixedAsset) => row.status,
      sortable: true,
      cell: (row: FixedAsset) => getStatusBadge(row.status),
      width: '120px',
    },
    {
      name: 'Actions',
      cell: (row: FixedAsset) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openViewModal(row)}
            className="btn btn-sm btn-outline text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400"
            title="View Asset"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="btn btn-sm btn-outline"
            title="Edit Asset"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
            title="Delete Asset"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '150px',
      sortable: false,
    },
  ], [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Fixed Asset Register"
            subtitle="Manage and track your organization's fixed assets"
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            {/* Search and Actions */}
            <div className="card mb-6">
              <div className="card-body">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assets by description, serial number, location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>
                  <button
                    onClick={openAddModal}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Asset
                  </button>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Fixed Assets ({filteredAssets.length})
                  </h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5"
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
                      <div className="absolute right-0 mt-2 z-10 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-lg border">
                        <ul className="p-3 space-y-1 text-sm text-gray-700">
                          <li>
                            <button
                              onClick={() => {
                                handleExportToCSV()
                                setShowExportDropdown(false)
                              }}
                              className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 me-2 text-green-600" />
                              Export to CSV
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                handleExportToExcel()
                                setShowExportDropdown(false)
                              }}
                              className="flex items-center w-full p-2 rounded-sm hover:bg-gray-100 text-left"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 me-2 text-blue-600" />
                              Export to Excel
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
                  data={filteredAssets}
                  pagination
                  responsive
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={
                    <div className="text-center py-12">
                      <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm ? 'No assets found' : 'No assets available'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? 'Try adjusting your search terms.'
                          : 'Get started by adding your first asset.'
                        }
                      </p>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Summary Cards */}
            {assets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CubeIcon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Assets
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {assets.length}
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
                        <CubeIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Cost
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {assets.reduce((sum, asset) => sum + asset.cost, 0).toLocaleString()}
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
                        <CubeIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Current Value
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {assets.reduce((sum, asset) => sum + asset.writtenDownValue, 0).toLocaleString()}
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
                        <CubeIcon className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Depreciation
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {assets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0).toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add/Edit Asset Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingAsset ? 'Edit Asset' : 'Add New Asset'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Description"
                    error={errors.description}
                    {...register('description')}
                    type="text"
                    required
                  />
                  
                  <FormField
                    label="Serial Number"
                    error={errors.serialNumber}
                    {...register('serialNumber')}
                    type="text"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Date of Purchase"
                    error={errors.dateOfPurchase}
                    {...register('dateOfPurchase')}
                    type="date"
                    required
                  />
                  
                  <FormField
                    label="Cost (LKR)"
                    error={errors.cost}
                    {...register('cost')}
                    type="number"
                    step="0.01"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Location"
                    error={errors.location}
                    {...register('location')}
                    type="text"
                    required
                  />
                  
                  <FormField
                    label="Source"
                    error={errors.source}
                    {...register('source')}
                    type="text"
                    placeholder="e.g., Purchase, Donation, Transfer"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Supplier"
                    error={errors.supplier}
                    {...register('supplier')}
                    type="text"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Ownership</label>
                    <select
                      {...register('ownership')}
                      className="input w-full"
                      required
                    >
                      <option value="Owned">Owned</option>
                      <option value="Leased">Leased</option>
                      <option value="Donated">Donated</option>
                    </select>
                    {errors.ownership && (
                      <p className="text-red-500 text-sm mt-1">{errors.ownership.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      {...register('category')}
                      className="input w-full"
                      required
                    >
                      <option value="">Select Category</option>
                      {assetCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                    )}
                  </div>
                  
                  <FormField
                    label="Depreciation Rate (%)"
                    error={errors.depreciationRate}
                    {...register('depreciationRate')}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                  />
                  
                  <FormField
                    label="Useful Life (Years)"
                    error={errors.usefulLife}
                    {...register('usefulLife')}
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary flex-1"
                  >
                    {isSubmitting ? 'Saving...' : (editingAsset ? 'Update Asset' : 'Add Asset')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Asset Modal */}
        {showViewModal && viewingAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Asset Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center">
                      <CubeIcon className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {viewingAsset.description}
                    </h4>
                    <p className="text-gray-500">Serial: {viewingAsset.serialNumber}</p>
                    <div className="mt-2">{getStatusBadge(viewingAsset.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Purchase
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {new Date(viewingAsset.dateOfPurchase).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Cost
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-semibold">
                        LKR {viewingAsset.cost.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {viewingAsset.location}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {viewingAsset.supplier}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {viewingAsset.category}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accumulated Depreciation
                      </label>
                      <p className="text-red-600 bg-red-50 px-3 py-2 rounded-md font-semibold">
                        LKR {viewingAsset.accumulatedDepreciation.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Written Down Value
                      </label>
                      <p className="text-green-600 bg-green-50 px-3 py-2 rounded-md font-semibold">
                        LKR {viewingAsset.writtenDownValue.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ownership
                      </label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {viewingAsset.ownership}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depreciation Rate
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {viewingAsset.depreciationRate}% per year
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Useful Life
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {viewingAsset.usefulLife} years
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-red-600">Delete Asset</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <CubeIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      Are you sure you want to delete this asset?
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {deletingAsset.description}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">
                    This action cannot be undone. The asset will be permanently removed from the register.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAsset}
                    disabled={isDeleting}
                    className="btn btn-danger flex-1"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Asset'}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
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
    </ProtectedRoute>
  )
}