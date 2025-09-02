'use client'

import { useState, useMemo } from 'react'
import DataTable from 'react-data-table-component'
import toast from 'react-hot-toast'
import Sidebar from '../../components/layout/SideBar'
import Header from '../../components/layout/Header'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DepreciationEntry } from '../../types/far'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline'

const mockDepreciationData: DepreciationEntry[] = [
  {
    id: 1,
    assetId: 1,
    assetDescription: 'Dell Laptop Computer',
    year: 2023,
    openingValue: 85000,
    depreciationAmount: 17000,
    closingValue: 68000,
    method: 'Straight Line',
    createdAt: '2023-12-31T23:59:59Z'
  },
  {
    id: 2,
    assetId: 1,
    assetDescription: 'Dell Laptop Computer',
    year: 2024,
    openingValue: 68000,
    depreciationAmount: 13600,
    closingValue: 54400,
    method: 'Straight Line',
    createdAt: '2024-12-31T23:59:59Z'
  },
  {
    id: 3,
    assetId: 2,
    assetDescription: 'Office Desk - Executive',
    year: 2023,
    openingValue: 25000,
    depreciationAmount: 2500,
    closingValue: 22500,
    method: 'Straight Line',
    createdAt: '2023-12-31T23:59:59Z'
  },
  {
    id: 4,
    assetId: 2,
    assetDescription: 'Office Desk - Executive',
    year: 2024,
    openingValue: 22500,
    depreciationAmount: 2250,
    closingValue: 20250,
    method: 'Straight Line',
    createdAt: '2024-12-31T23:59:59Z'
  }
]

export default function DepreciationTrackingPage() {
  const [depreciationData, setDepreciationData] = useState<DepreciationEntry[]>(mockDepreciationData)
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const filteredData = useMemo(() => {
    let filtered = depreciationData

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.assetDescription.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(entry => entry.year.toString() === yearFilter)
    }

    return filtered
  }, [depreciationData, searchTerm, yearFilter])

  const availableYears = useMemo(() => {
    const years = [...new Set(depreciationData.map(entry => entry.year))]
    return years.sort((a, b) => b - a)
  }, [depreciationData])

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredData.map(entry => ({
        'Asset Description': entry.assetDescription,
        'Year': entry.year,
        'Opening Value (LKR)': entry.openingValue,
        'Depreciation Amount (LKR)': entry.depreciationAmount,
        'Closing Value (LKR)': entry.closingValue,
        'Method': entry.method
      }))

      await exportToCSV(csvData, {
        filename: `depreciation_tracking_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success('Depreciation data exported to CSV successfully!')
    } catch (error) {
      toast.error('Failed to export depreciation data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const excelData = filteredData.map(entry => ({
        'Asset Description': entry.assetDescription,
        'Year': entry.year,
        'Opening Value (LKR)': entry.openingValue,
        'Depreciation Amount (LKR)': entry.depreciationAmount,
        'Closing Value (LKR)': entry.closingValue,
        'Method': entry.method
      }))

      await exportToExcel(excelData, {
        filename: `depreciation_tracking_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Depreciation Tracking'
      })
      toast.success('Depreciation data exported to Excel successfully!')
    } catch (error) {
      toast.error('Failed to export depreciation data')
    } finally {
      setIsExporting(false)
    }
  }

  const calculateDepreciation = () => {
    toast.success('Depreciation calculation completed for current year!')
  }

  const columns = useMemo(() => [
    {
      name: 'Asset',
      selector: (row: DepreciationEntry) => row.assetDescription,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <ChartBarIcon className="h-4 w-4 text-primary-600" />
            </div>
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900">{row.assetDescription}</div>
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Year',
      selector: (row: DepreciationEntry) => row.year,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <span className="font-medium text-gray-900">{row.year}</span>
      ),
      width: '80px',
    },
    {
      name: 'Opening Value',
      selector: (row: DepreciationEntry) => row.openingValue,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <span className="text-gray-900">
          LKR {row.openingValue.toLocaleString()}
        </span>
      ),
      width: '140px',
    },
    {
      name: 'Depreciation',
      selector: (row: DepreciationEntry) => row.depreciationAmount,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <span className="text-red-600 font-medium">
          LKR {row.depreciationAmount.toLocaleString()}
        </span>
      ),
      width: '140px',
    },
    {
      name: 'Closing Value',
      selector: (row: DepreciationEntry) => row.closingValue,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <span className="text-green-600 font-medium">
          LKR {row.closingValue.toLocaleString()}
        </span>
      ),
      width: '140px',
    },
    {
      name: 'Method',
      selector: (row: DepreciationEntry) => row.method,
      sortable: true,
      cell: (row: DepreciationEntry) => (
        <span className="badge badge-primary">{row.method}</span>
      ),
      width: '140px',
    },
  ], [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Depreciation Tracking"
            subtitle="Monitor asset depreciation and written down values"
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            {/* Filters and Actions */}
            <div className="card mb-6">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>

                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </select>

                  <button
                    onClick={calculateDepreciation}
                    className="btn btn-primary"
                  >
                    <CalculatorIcon className="h-5 w-5 mr-2" />
                    Calculate Depreciation
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="btn btn-outline w-full"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 me-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4 me-2" />
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
            </div>

            {/* Depreciation Table */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Depreciation Entries ({filteredData.length})
                  </h3>
                </div>
              </div>
              <div className="card-body p-0">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  pagination
                  responsive
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={
                    <div className="text-center py-12">
                      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No depreciation entries found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Depreciation entries will appear here after calculation.
                      </p>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Summary Cards */}
            {filteredData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Opening Value
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {filteredData.reduce((sum, entry) => sum + entry.openingValue, 0).toLocaleString()}
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
                        <ChartBarIcon className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Depreciation
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {filteredData.reduce((sum, entry) => sum + entry.depreciationAmount, 0).toLocaleString()}
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
                        <ChartBarIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Closing Value
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            LKR {filteredData.reduce((sum, entry) => sum + entry.closingValue, 0).toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Depreciation Methods Info */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Depreciation Methods</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Straight Line Method</h4>
                    <p className="text-sm text-blue-700">
                      Depreciation = (Cost - Salvage Value) / Useful Life
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Equal depreciation amount each year
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Reducing Balance Method</h4>
                    <p className="text-sm text-purple-700">
                      Depreciation = Book Value × Depreciation Rate
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      Higher depreciation in early years
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}