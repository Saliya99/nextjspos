'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import { ProductBrand } from '../../types'
import { apiClient } from '../../lib/api'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
    PlusIcon,
    PencilIcon,
    XMarkIcon,
    TagIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    ChevronDownIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

interface FormErrors {
    productBrandName?: string
    general?: string
}

interface SortState {
    sortBy: string
    sortOrder: 'asc' | 'desc'
}

export default function ProductBrandsPage() {
    const [brands, setBrands] = useState<ProductBrand[]>([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null)
    const [deletingBrand, setDeletingBrand] = useState<ProductBrand | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [formData, setFormData] = useState({
        productBrandName: '',
    })

    const [currentPage, setCurrentPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [totalRows, setTotalRows] = useState(0)
    const [sortState, setSortState] = useState<SortState>({
        sortBy: 'product_brand_id',
        sortOrder: 'asc'
    })
    const [showExportDropdown, setShowExportDropdown] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const loadBrands = useCallback(async () => {
        setLoading(true)
        try {
            const response = await apiClient.getAllProductBrands({
                page: currentPage,
                per_page: perPage,
                sort_by: sortState.sortBy,
                sort_order: sortState.sortOrder
            })

            if (response.success) {
                setBrands(response.data)
                setTotalRows(response.pagination.total)
            } else {
                setBrands([])
                setTotalRows(0)
            }
        } catch (error) {
            setBrands([])
            setTotalRows(0)
        } finally {
            setLoading(false)
        }
    }, [currentPage, perPage, sortState])

    useEffect(() => {
        loadBrands()
    }, [loadBrands])

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

    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout
            return async (searchValue: string) => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(async () => {
                    if (searchValue.trim()) {
                        setLoading(true)
                        try {
                            const response = await apiClient.searchProductBrands(searchValue, {
                                page: 1,
                                per_page: perPage,
                                sort_by: sortState.sortBy,
                                sort_order: sortState.sortOrder
                            })

                            if (response.success) {
                                setBrands(response.data)
                                setTotalRows(response.pagination.total)
                                setCurrentPage(1)
                            } else {
                                setBrands([])
                                setTotalRows(0)
                            }
                        } catch (error) {
                            setBrands([])
                            setTotalRows(0)
                        } finally {
                            setLoading(false)
                        }
                    } else {
                        setCurrentPage(1)
                        loadBrands()
                    }
                }, 500)
            }
        })(),
        [perPage, sortState, loadBrands]
    )

    const validateForm = (): boolean => {
        const errors: FormErrors = {}

        if (!formData.productBrandName.trim()) {
            errors.productBrandName = 'Brand name is required'
        } else if (formData.productBrandName.trim().length > 100) {
            errors.productBrandName = 'Brand name must be less than 100 characters'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        setFormErrors({})

        try {
            let response

            if (editingBrand) {
                response = await apiClient.updateProductBrand(editingBrand.productBrandId, formData)
            } else {
                response = await apiClient.addNewProductBrand(formData)
            }

            if (response.success) {
                toast.success(editingBrand ? 'Brand updated successfully!' : 'Brand added successfully!')
                setShowModal(false)
                resetForm()

                if (searchTerm.trim()) {
                    debouncedSearch(searchTerm)
                } else {
                    loadBrands()
                }
            } else {
                setFormErrors({ general: response.message || 'Failed to save brand' })
            }
        } catch (error) {
            setFormErrors({ general: 'An unexpected error occurred. Please try again.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({
            productBrandName: '',
        })
        setFormErrors({})
        setEditingBrand(null)
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (brand: ProductBrand) => {
        setFormData({
            productBrandName: brand.productBrandName,
        })
        setEditingBrand(brand)
        setFormErrors({})
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        resetForm()
    }

    const openDeleteModal = (brand: ProductBrand) => {
        setDeletingBrand(brand)
        setShowDeleteModal(true)
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setDeletingBrand(null)
    }

    const handleDeleteBrand = async () => {
        if (!deletingBrand) return

        setIsDeleting(true)
        try {
            const response = await apiClient.deleteProductBrand(deletingBrand.productBrandId)

            if (response.success) {
                toast.success('Brand deleted successfully!')
                closeDeleteModal()

                if (searchTerm.trim()) {
                    debouncedSearch(searchTerm)
                } else {
                    loadBrands()
                }
            } else {
                toast.error(response.message || 'Failed to delete brand')
            }
        } catch (error) {
            toast.error('An unexpected error occurred while deleting the brand')
        } finally {
            setIsDeleting(false)
        }
    }

    const columns = useMemo(() => [
        {
            name: 'Brand',
            selector: (row: ProductBrand) => row.productBrandName,
            sortable: true,
            sortField: 'brand_name',
            cell: (row: ProductBrand) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <TagIcon className="h-5 w-5 text-primary-600" />
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="font-medium text-gray-900">
                            {row.productBrandName}
                        </div>
                    </div>
                </div>
            ),
            width: '300px',
        },
        {
            name: 'Actions',
            cell: (row: ProductBrand) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => openEditModal(row)}
                        className="btn btn-sm btn-outline"
                        aria-label={`Edit brand ${row.productBrandName}`}
                    >
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => openDeleteModal(row)}
                        className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                        aria-label={`Delete brand ${row.productBrandName}`}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            ),
            width: '120px',
            sortable: false,
        },
    ], [])

    const handleExportToCSV = async () => {
        setIsExporting(true)
        try {
            const response = await apiClient.getAllProductBrands({
                paginate: false
            })

            if (!response.success || !response.data || response.data.length === 0) {
                toast.error('No brands to export')
                return
            }

            const allBrands = response.data

            const csvData = allBrands.map(brand => ({
                'Brand ID': brand.productBrandId,
                'Brand Name': brand.productBrandName
            }))

            await exportToCSV(csvData, {
                filename: `brands_${new Date().toISOString().split('T')[0]}.csv`
            })
            toast.success(`Successfully exported ${allBrands.length} brands to CSV`)
        } catch (error) {
            toast.error('Failed to export brands. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    const handleExportToExcel = async () => {
        setIsExporting(true)
        try {
            const response = await apiClient.getAllProductBrands({
                paginate: false
            })

            if (!response.success || !response.data || response.data.length === 0) {
                toast.error('No brands to export')
                return
            }

            const allBrands = response.data

            const excelData = allBrands.map(brand => ({
                'Brand ID': brand.productBrandId,
                'Brand Name': brand.productBrandName
            }))

            await exportToExcel(excelData, {
                filename: `brands_${new Date().toISOString().split('T')[0]}.xlsx`,
                sheetName: 'Brands'
            })
            toast.success(`Successfully exported ${allBrands.length} brands to Excel`)
        } catch (error) {
            toast.error('Failed to export brands. Please try again.')
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
        const newSortBy = column.sortField || column.selector
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
                    title="Product Brands"
                    subtitle="Manage your product brands"
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <div className="card mb-6">
                        <div className="card-body">
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search brands by name..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            setSearchTerm(value)
                                            debouncedSearch(value)
                                        }}
                                        className="input pl-10 w-full"
                                        aria-label="Search brands"
                                    />
                                </div>
                                <button
                                    onClick={openAddModal}
                                    className="btn btn-primary"
                                    aria-label="Add new brand"
                                >
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Add Brand
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Brands {totalRows > 0 ? `(${totalRows})` : ''}
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
                                data={brands}
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
                                        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                                            {searchTerm ? 'No brands found' : 'No brands available'}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm
                                                ? 'Try adjusting your search terms.'
                                                : 'Get started by adding your first brand.'
                                            }
                                        </p>
                                    </div>
                                }
                                progressComponent={
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-label="Loading brands"></div>
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
                                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    value={formData.productBrandName}
                                    onChange={(e) => setFormData({ ...formData, productBrandName: e.target.value })}
                                    className={`input w-full ${formErrors.productBrandName ? 'border-red-500' : ''}`}
                                    required
                                />
                                {formErrors.productBrandName && (
                                    <p className="text-red-500 text-sm">{formErrors.productBrandName}</p>
                                )}
                            </div>

                            {formErrors.general && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                                    <p className="text-red-700 text-sm font-medium">{formErrors.general}</p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="btn btn-primary flex-1"
                                >
                                    {isSubmitting ? 'Adding...' : (editingBrand ? 'Update Brand' : 'Add Brand')}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && deletingBrand && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-red-600">
                                Delete Brand
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
                                        <TagIcon className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-900">
                                        Are you sure you want to delete this brand?
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {deletingBrand.productBrandName}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-700">
                                    This action cannot be undone. The brand will be permanently removed from your database.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteBrand}
                                    disabled={isDeleting}
                                    className="btn btn-danger flex-1"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Brand'}
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