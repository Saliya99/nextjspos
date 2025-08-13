'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
// import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import FormField from '../components/forms/FormField'
import { apiClient } from '../lib/api'
import { SearchProductResult, GrnItem, ProductBrand, ProductCategory } from '../types'
import { productSchema, ProductFormData } from '../lib/schemas'
import { exportToCSV, exportToExcel } from '../lib/exportService'
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
} from '@heroicons/react/24/outline'

interface SortState {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function ProductsPage() {
  const [products, setProducts] = useState<SearchProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<SearchProductResult | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<SearchProductResult | null>(null)
  const [viewingProduct, setViewingProduct] = useState<SearchProductResult | null>(null)
  const [grnData, setGrnData] = useState<GrnItem[]>([])
  const [loadingGrnData, setLoadingGrnData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      productLocation: '',
      productDetails: '',
      productType: 'unit',
      productCost: '',
      productSelling: '',
      productQty: '',
      brandId: undefined,
      categoryId: undefined
    }
  })

  const [brands, setBrands] = useState<ProductBrand[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filteredBrands, setFilteredBrands] = useState<ProductBrand[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ProductCategory[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [brandSearchTerm, setBrandSearchTerm] = useState('')
  const [categorySearchTerm, setCategorySearchTerm] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [sortState, setSortState] = useState<SortState>({
    sortBy: 'product_id',
    sortOrder: 'desc'
  })
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAllProducts({
        page: currentPage,
        per_page: perPage,
        sort_by: sortState.sortBy,
        sort_order: sortState.sortOrder,
        include_grn: true,
        paginate: true
      })

      if (response.success) {
        setProducts(response.data)
        setTotalRows(response.pagination.total)
      } else {
        setProducts([])
        setTotalRows(0)
      }
    } catch (error) {
      setProducts([])
      setTotalRows(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, perPage, sortState])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const loadBrands = useCallback(async () => {
    setLoadingBrands(true)
    try {
      const response = await apiClient.getAllProductBrands({
        sort_by: 'brand_name',
        sort_order: 'asc',
        paginate: false
      })
      if (response.success) {
        setBrands(response.data)
      }
    } catch (error) {
      console.error('Failed to load brands:', error)
    } finally {
      setLoadingBrands(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const response = await apiClient.getAllProductCategories({
        sort_by: 'category_name',
        sort_order: 'asc',
        paginate: false
      })
      if (response.success) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    loadBrands()
    loadCategories()
  }, [loadBrands, loadCategories])

  useEffect(() => {
    if (brandSearchTerm.trim()) {
      const filtered = brands.filter(brand =>
        brand.productBrandName.toLowerCase().includes(brandSearchTerm.toLowerCase())
      )
      setFilteredBrands(filtered)
    } else {
      setFilteredBrands(brands)
    }
  }, [brands, brandSearchTerm])

  useEffect(() => {
    if (categorySearchTerm.trim()) {
      const filtered = categories.filter(category =>
        category.productCategoryName.toLowerCase().includes(categorySearchTerm.toLowerCase())
      )
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(categories)
    }
  }, [categories, categorySearchTerm])

  const handleBrandSelect = (brand: ProductBrand) => {
    setValue('brandId', brand.productBrandId)
    setBrandSearchTerm(brand.productBrandName)
    setShowBrandDropdown(false)
  }

  const handleCategorySelect = (category: ProductCategory) => {
    setValue('categoryId', category.productCategoryId)
    setCategorySearchTerm(category.productCategoryName)
    setShowCategoryDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showExportDropdown && !target.closest('.export-dropdown')) {
        setShowExportDropdown(false)
      }
      if (showBrandDropdown && !target.closest('.brand-dropdown')) {
        setShowBrandDropdown(false)
      }
      if (showCategoryDropdown && !target.closest('.category-dropdown')) {
        setShowCategoryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportDropdown, showBrandDropdown, showCategoryDropdown])

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return async (searchValue: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (searchValue.trim()) {
            setLoading(true)
            try {
              const response = await apiClient.searchProductsWithGRN(searchValue, {
                page: 1,
                per_page: perPage,
                sort_by: sortState.sortBy,
                sort_order: sortState.sortOrder,
                paginate: true
              })

              if (response.success) {
                setProducts(response.data)
                setTotalRows(response.pagination.total)
                setCurrentPage(1)
              } else {
                setProducts([])
                setTotalRows(0)
              }
            } catch (error) {
              setProducts([])
              setTotalRows(0)
            } finally {
              setLoading(false)
            }
          } else {
            setCurrentPage(1)
            loadProducts()
          }
        }, 500)
      }
    })(),
    [loadProducts, perPage, sortState]
  )

  const onSubmit = async (data: ProductFormData) => {
    try {
      const submitData: any = {
        productName: data.productName,
        productLocation: data.productLocation,
        productDetails: data.productDetails,
        productType: data.productType,
        productCost: parseFloat(data.productCost),
        productSelling: parseFloat(data.productSelling),
        productQty: parseFloat(data.productQty),
      }

      if (data.brandId && data.brandId > 0) {
        submitData.brandId = data.brandId
      }
      if (data.categoryId && data.categoryId > 0) {
        submitData.categoryId = data.categoryId
      }

      let response

      if (editingProduct) {
        response = await apiClient.updateProduct(editingProduct.productId, submitData)
      } else {
        response = await apiClient.addNewProduct(submitData)
      }

      if (response.success) {
        toast.success(editingProduct ? 'Product updated successfully!' : 'Product added successfully!')
        setShowModal(false)
        resetForm()

        if (searchTerm.trim()) {
          debouncedSearch(searchTerm)
        } else {
          loadProducts()
        }
      } else {
        toast.error(response.message || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  const resetForm = () => {
    reset({
      productName: '',
      productLocation: '',
      productDetails: '',
      productType: 'unit',
      productCost: '',
      productSelling: '',
      productQty: '',
      brandId: undefined,
      categoryId: undefined,
    })
    setBrandSearchTerm('')
    setCategorySearchTerm('')
    setEditingProduct(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (product: SearchProductResult) => {
    reset({
      productName: product.productName,
      productLocation: product.productLocation,
      productDetails: product.productDetails || '',
      productType: product.productType || 'unit',
      productCost: product.productCost.toString(),
      productSelling: product.productSelling.toString(),
      productQty: product.productQty?.toString() || '0',
      brandId: product.productBrand?.productBrandId,
      categoryId: product.productCategory?.productCategoryId,
    })
    setBrandSearchTerm(product.productBrand?.productBrandName || '')
    setCategorySearchTerm(product.productCategory?.productCategoryName || '')
    setEditingProduct(product)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const openDeleteModal = (product: SearchProductResult) => {
    setDeletingProduct(product)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingProduct(null)
  }

  const openViewModal = async (product: SearchProductResult) => {
    setViewingProduct(product)
    setShowViewModal(true)

    if (product.grnData && product.grnData.length > 0) {
      setGrnData(product.grnData)
    } else {
      setGrnData([])
    }
    setLoadingGrnData(false)
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingProduct(null)
    setGrnData([])
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    setIsDeleting(true)
    try {
      const response = await apiClient.deleteProduct(deletingProduct.productId)

      if (response.success) {
        toast.success('Product deleted successfully!')
        closeDeleteModal()

        if (searchTerm.trim()) {
          debouncedSearch(searchTerm)
        } else {
          loadProducts()
        }
      } else {
        toast.error(response.message || 'Failed to delete product')
      }
    } catch (error) {
      toast.error('An unexpected error occurred while deleting the product')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStockStatus = (qty: number | null) => {
    if (qty === null || qty === 0) {
      return <span className="badge badge-danger">Out of Stock</span>
    } else if (qty < 10) {
      return <span className="badge badge-warning">Low Stock</span>
    } else {
      return <span className="badge badge-success">In Stock</span>
    }
  }

  const columns = useMemo(() => [
    {
      name: 'Product',
      selector: (row: SearchProductResult) => row.productName,
      sortable: true,
      sortField: 'product_name',
      cell: (row: SearchProductResult) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <CubeIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">
              {row.productName}
            </div>
            {row.productDetails && (
              <div className="text-sm text-gray-500">
                {row.productDetails}
              </div>
            )}
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Product Number',
      selector: (row: SearchProductResult) => row.productNumber,
      sortable: true,
      sortField: 'product_number',
      cell: (row: SearchProductResult) => (
        <span className="font-mono text-sm text-gray-900">{row.productNumber}</span>
      ),
      width: '250px',
    },
    {
      name: 'Location',
      selector: (row: SearchProductResult) => row.productLocation,
      sortable: true,
      sortField: 'product_location',
      cell: (row: SearchProductResult) => (
        <span className="text-gray-900">{row.productLocation}</span>
      ),
      width: '120px',
    },
    {
      name: 'Product Details',
      selector: (row: SearchProductResult) => row.productDetails || '',
      sortable: true,
      sortField: 'product_details',
      cell: (row: SearchProductResult) => (
        <span className="text-gray-900">{row.productDetails || '-'}</span>
      ),
      width: '250px',
    },
    {
      name: 'Actions',
      cell: (row: SearchProductResult) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openViewModal(row)}
            className="btn btn-sm btn-outline text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400"
            aria-label={`View product ${row.productName}`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="btn btn-sm btn-outline"
            aria-label={`Edit product ${row.productName}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
            aria-label={`Delete product ${row.productName}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '150px',
      sortable: false,
    },
  ], [])

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.getAllProducts({
        include_grn: false,
        paginate: false
      })

      if (!response.success || !response.data || response.data.length === 0) {
        toast.error('No products to export')
        return
      }

      const allProducts = response.data

      const csvData = allProducts.map(product => ({
        'Product Name': product.productName,
        'Product Number': product.productNumber,
        'Location': product.productLocation,
        'Details': product.productDetails || '',
        'Type': product.productType || 'unit',
        'Quantity': product.productQty || 0,
        'Brand': product.productBrand?.productBrandName || 'Not specified',
        'Category': product.productCategory?.productCategoryName || 'Not specified',
      }))

      await exportToCSV(csvData, {
        filename: `products_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success(`Successfully exported ${allProducts.length} products to CSV`)
    } catch (error) {
      toast.error('Failed to export products. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.getAllProducts({
        include_grn: false,
        paginate: false
      })

      if (!response.success || !response.data || response.data.length === 0) {
        toast.error('No products to export')
        return
      }

      const allProducts = response.data

      const excelData = allProducts.map(product => ({
        'Product Name': product.productName,
        'Product Number': product.productNumber,
        'Location': product.productLocation,
        'Details': product.productDetails || '',
        'Type': product.productType || 'unit',
        'Quantity': product.productQty || 0,
        'Brand': product.productBrand?.productBrandName || 'Not specified',
        'Category': product.productCategory?.productCategoryName || 'Not specified',
      }))

      await exportToExcel(excelData, {
        filename: `products_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Products'
      })
      toast.success(`Successfully exported ${allProducts.length} products to Excel`)
    } catch (error) {
      toast.error('Failed to export products. Please try again.')
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
          title="Product Management"
          subtitle="View and manage your product inventory"
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="card mb-6">
            <div className="card-body">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name or product number..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchTerm(value)
                      debouncedSearch(value)
                    }}
                    className="input pl-10 w-full"
                    aria-label="Search products"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="btn btn-primary"
                  aria-label="Add new product"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Product
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Products {totalRows > 0 ? `(${totalRows})` : ''}
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
                data={products}
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
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? 'No products found' : 'No products available'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'Get started by adding your first product.'
                      }
                    </p>
                  </div>
                }
                progressComponent={
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-label="Loading products"></div>
                  </div>
                }
              />
            </div>
          </div>

          {products.length > 0 && (
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
                          Total Products
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {products.length}
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
                      <CubeIcon className="h-8 w-8 text-success-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          In Stock
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {products.filter(p => p.productQty && p.productQty >= 10).length}
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
                      <CubeIcon className="h-8 w-8 text-warning-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Low Stock
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {products.filter(p => p.productQty && p.productQty > 0 && p.productQty < 10).length}
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
                      <CubeIcon className="h-8 w-8 text-danger-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Out of Stock
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {products.filter(p => p.productQty === null || p.productQty === 0).length}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                label="Product Name"
                error={errors.productName}
                {...register('productName')}
                type="text"
                required
              />
              
              <FormField
                label="Product Type"
                {...register('productType')}
                type="text"
                placeholder="e.g., unit, kg, liter, piece"
                required
              />
              
              <FormField
                label="Quantity"
                error={errors.productQty}
                {...register('productQty')}
                type="number"
                min="0"
                required
              />
              <div className="relative brand-dropdown">
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={brandSearchTerm}
                  onChange={(e) => {
                    setBrandSearchTerm(e.target.value)
                    setShowBrandDropdown(true)
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  placeholder="Search brands..."
                  className="input w-full"
                />
                {showBrandDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingBrands ? (
                      <div className="p-3 text-center text-gray-500">Loading brands...</div>
                    ) : filteredBrands.length > 0 ? (
                      filteredBrands.map((brand) => (
                        <div
                          key={brand.productBrandId}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleBrandSelect(brand)}
                        >
                          {brand.productBrandName}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No brands found</div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative category-dropdown">
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={categorySearchTerm}
                  onChange={(e) => {
                    setCategorySearchTerm(e.target.value)
                    setShowCategoryDropdown(true)
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  placeholder="Search categories..."
                  className="input w-full"
                />
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loadingCategories ? (
                      <div className="p-3 text-center text-gray-500">Loading categories...</div>
                    ) : filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <div
                          key={category.productCategoryId}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category.productCategoryName}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No categories found</div>
                    )}
                  </div>
                )}
              </div>
                             <FormField
                 label="Location"
                 error={errors.productLocation}
                 {...register('productLocation')}
                 type="text"
                 required
               />
               
               <div>
                 <label className="block text-sm font-medium mb-1">Details</label>
                 <textarea
                   {...register('productDetails')}
                   className="input w-full"
                   rows={3}
                 />
               </div>
               
               <FormField
                 label="Cost Price (LKR)"
                 error={errors.productCost}
                 {...register('productCost')}
                 type="number"
                 step="0.01"
                 required
               />
               
               <FormField
                 label="Selling Price (LKR)"
                 error={errors.productSelling}
                 {...register('productSelling')}
                 type="number"
                 step="0.01"
                 required
               />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1"
                >
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
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

      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-red-600">
                Delete Product
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
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <CubeIcon className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    Are you sure you want to delete this product?
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {deletingProduct.productName}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">
                  This action cannot be undone. The product will be permanently removed from your database.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="btn btn-danger flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Product'}
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

      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Product Details
              </h3>
              <button
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close view modal"
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
                    {viewingProduct.productName}
                  </h4>
                  <p className="text-gray-500">
                    Product #{viewingProduct.productNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productName}
                    </p>
                  </div>

                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Number
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono flex-1 flex items-center">
                      {viewingProduct.productNumber}
                    </p>
                  </div>

                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productLocation}
                    </p>
                  </div>

                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Details
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productDetails || 'No details available'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productBrand?.productBrandName || 'Not specified'}
                    </p>
                  </div>

                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productCategory?.productCategoryName || 'Not specified'}
                    </p>
                  </div>

                  <div className="flex flex-col h-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1 flex items-center">
                      {viewingProduct.productType || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {grnData.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      GRN Stock & Pricing Data
                    </label>
                    {loadingGrnData ? (
                      <div className="bg-gray-50 rounded-md p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading GRN data...</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                GRN ID
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cost Price
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Selling Price
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {grnData.map((grnItem, index) => (
                              <tr key={grnItem.grnItemsId}>
                                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900 font-mono">
                                  {grnItem.grnItemsId}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900">
                                  {grnItem.orderedQty || 0} {viewingProduct.productType}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900">
                                  {grnItem.costPrice ? `LKR ${grnItem.costPrice.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900">
                                  {grnItem.sellingPrice ? `LKR ${grnItem.sellingPrice.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-3 py-3 text-sm">
                                  {getStockStatus(grnItem.orderedQty || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Stock & Pricing Data {loadingGrnData && '(Loading GRN data...)'}
                    </label>

                    <div className="bg-gray-50 rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cost Price
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Selling Price
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900">
                              1
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900 font-mono">
                              {viewingProduct.productName}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              {viewingProduct.productQty} {viewingProduct.productType}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              LKR {viewingProduct.productCost.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-900">
                              LKR {viewingProduct.productSelling.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              {getStockStatus(viewingProduct.productQty)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={closeViewModal}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}