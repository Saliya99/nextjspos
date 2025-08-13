'use client'

import { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import ProtectedRoute from '../components/ProtectedRoute'
import { apiClient } from '../lib/api'
import { 
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function ReportsPage() {
  // const { user } = useAuth()
  const [todayReport, setTodayReport] = useState<Record<string, unknown> | null>(null)
  const [customReport, setCustomReport] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadTodayReport()
    // Set default dates (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  const loadTodayReport = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getTodayReport()
      if (response.result) {
        setTodayReport(response)
      } else {
        setTodayReport(null)
      }
    } catch (error) {
      console.error('Failed to load today report:', error)
      setTodayReport(null)
      alert('Failed to load today\'s report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.getAllReport(startDate, endDate)
      if (response.result) {
        setCustomReport(response)
      }
    } catch (error) {
      console.error('Failed to load custom report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Reports & Analytics" 
          subtitle="View sales reports and business analytics" 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* Today's Report */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Today&apos;s Report</h3>
              </div>
            </div>
            <div className="card-body">
              {loading && !todayReport ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Invoices</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {String((todayReport?.totalInvoices as number) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Total Sales</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency((todayReport?.totalSales as number) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Items Sold</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {String((todayReport?.itemsSold as number) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Avg. Sale</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {formatCurrency((todayReport?.averageSale as number) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Date Range Report */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Custom Date Range Report</h3>
                </div>
                <button
                  onClick={loadCustomReport}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Loading...' : 'Generate Report'}
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Date Range Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadCustomReport}
                    disabled={loading || !startDate || !endDate}
                    className="btn btn-outline w-full"
                  >
                    Update Report
                  </button>
                </div>
              </div>

              {/* Custom Report Results */}
              {customReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600">Total Invoices</p>
                        <p className="text-2xl font-bold text-indigo-900">
                          {String((customReport.totalInvoices as number) || 0)}
                        </p>
                        <p className="text-xs text-indigo-600">
                          {formatDate(startDate)} - {formatDate(endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-emerald-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatCurrency((customReport.totalRevenue as number) || 0)}
                        </p>
                        <p className="text-xs text-emerald-600">
                          Period total
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-rose-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-rose-600">Daily Average</p>
                        <p className="text-2xl font-bold text-rose-900">
                          {formatCurrency((customReport.dailyAverage as number) || 0)}
                        </p>
                        <p className="text-xs text-rose-600">
                          Per day
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Report Actions</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="btn btn-outline">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Export to PDF
                </button>
                <button className="btn btn-outline">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Export to Excel
                </button>
                <button className="btn btn-outline">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="card">
              <div className="card-header">
                <h4 className="text-md font-medium text-gray-900">Sales Trends</h4>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Sales chart visualization would go here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h4 className="text-md font-medium text-gray-900">Top Products</h4>
              </div>
              <div className="card-body">
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Top selling products would be listed here</p>
                  <p className="text-sm">Requires product sales analytics</p>
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