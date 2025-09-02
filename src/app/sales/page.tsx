'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import ProtectedRoute from '../components/ProtectedRoute'
import { apiClient } from '../lib/api'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'
import DataTable from 'react-data-table-component';
const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false })

export default function SalesReportsPage() {
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCustomDateRange, setIsCustomDateRange] = useState(false)
  const [trendGrouping, setTrendGrouping] = useState<'day' | 'week' | 'month'>('day');
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topProductsPage, setTopProductsPage] = useState(1);
  const [topProductsPerPage] = useState(10);
  const [topProductsTotal, setTopProductsTotal] = useState(0);
  const [topProductsLastPage, setTopProductsLastPage] = useState(1);
  const [topProductsLoading, setTopProductsLoading] = useState(false);

  useEffect(() => {
    loadTodayReport()
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    setEndDate(todayString)
    setStartDate(todayString)
  }, [])

  const loadTodayReport = async () => {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    setLoading(true)
    setIsCustomDateRange(false)
    try {
      const response = await apiClient.getSalesStatistics(todayString, todayString, trendGrouping)
      if (response.result) {
        setReportData(response)
      } else {
        setReportData(null)
      }
    } catch (error) {
      setReportData(null)
      toast.error('Failed to load today\'s report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    setLoading(true)
    setIsCustomDateRange(true)
    try {
      const response = await apiClient.getSalesStatistics(startDate, endDate, trendGrouping)
      if (response.result) {
        setReportData(response)
      }
    } catch (error) {
      setReportData(null)
      toast.error('Failed to load custom report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadSalesTrends = async (start: string, end: string, grouping: 'day' | 'week' | 'month') => {
    try {
      const response = await apiClient.getSalesTrends(start, end, grouping);
      if (response.result && Array.isArray(response.SalesTrends)) {
        setSalesTrends(response.SalesTrends);
      } else {
        setSalesTrends([]);
      }
    } catch (error) {
      setSalesTrends([]);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadSalesTrends(startDate, endDate, trendGrouping);
    }
  }, [startDate, endDate, trendGrouping]);

  const loadTopProducts = async (page = 1) => {
    if (!startDate || !endDate) return;
    setTopProductsLoading(true);
    try {
      const response = await apiClient.getTopProducts(startDate, endDate, page, topProductsPerPage);
      if (response.result && Array.isArray(response.TopProducts)) {
        setTopProducts(response.TopProducts);
        setTopProductsTotal(response.pagination?.total || 0);
        setTopProductsLastPage(response.pagination?.last_page || 1);
        setTopProductsPage(response.pagination?.page || 1);
      } else {
        setTopProducts([]);
        setTopProductsTotal(0);
        setTopProductsLastPage(1);
        setTopProductsPage(1);
      }
    } catch (error) {
      setTopProducts([]);
      setTopProductsTotal(0);
      setTopProductsLastPage(1);
      setTopProductsPage(1);
    } finally {
      setTopProductsLoading(false);
    }
  };

  useEffect(() => {
    loadTopProducts(topProductsPage);
  }, [topProductsPage, startDate, endDate]);

  const handleTopProductsPageChange = (page: number) => {
    setTopProductsPage(page);
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatWeek = (period: string | number) => {
    if (typeof period === 'number') period = period.toString();
    if (period.length === 6) {
      return `${period.slice(0, 4)}-W${period.slice(4)}`;
    }
    return period;
  };

  const topProductsColumns = [
    {
      name: 'Rank',
      selector: (row: any) => '',
      width: '80px',
      sortable: false,
      cell: (row: any, idx: number) => <span>{(topProductsPage - 1) * topProductsPerPage + idx + 1}</span>,
    },
    {
      name: 'Product Name',
      selector: (row: any) => row.product_name,
      sortable: true,
      cell: (row: any) => <span className="font-medium text-gray-800">{row.product_name}</span>,
    },
    {
      name: 'Quantity Sold',
      selector: (row: any) => row.total_quantity,
      sortable: true,
      cell: (row: any) => <span className="text-gray-600">{row.total_quantity.toLocaleString('en-US')}</span>,
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Sales Overview"
            subtitle="View sales overview and business analytics"
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); loadCustomReport(); }}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); loadCustomReport(); }}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="card mb-6">
              <div className="card-header">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                </div>
              </div>
              <div className="card-body">
                {loading && !reportData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                        <p className="text-sm font-medium text-blue-600 ml-2">Total Invoices</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mt-2">
                        {((reportData?.TotalInvoiceCount as number) || 0).toLocaleString('en-US')}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-8 w-8 text-purple-600" />
                        <p className="text-sm font-medium text-purple-600 ml-2">Items Sold</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {((reportData?.TotalItemsSold as number) || 0).toLocaleString('en-US')}
                      </p>
                    </div>

                    <div className="bg-teal-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-teal-600" />
                        <p className="text-sm font-medium text-teal-600 ml-2">Total Gross Sales</p>
                      </div>
                      <p className="text-2xl font-bold text-teal-900 mt-2">
                        {formatCurrency((reportData?.TotalGrossSales as number) || 0)}
                      </p>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-600 ml-2">Total Discounts</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900 mt-2">
                        {formatCurrency((reportData?.TotalDiscount as number) || 0)}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                        <p className="text-sm font-medium text-green-600 ml-2">Total Sales</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900 mt-2">
                        {formatCurrency((reportData?.TotalSales as number) || 0)}
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-600 ml-2">Cash Income</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-900 mt-2">
                        {formatCurrency((reportData?.CashIncome as number) || 0)}
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
                        <p className="text-sm font-medium text-orange-600 ml-2">Credit Income</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-900 mt-2">
                        {formatCurrency((reportData?.CreditIncome as number) || 0)}
                      </p>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
                        <p className="text-sm font-medium text-red-600 ml-2">Product Cost Total</p>
                      </div>
                      <p className="text-2xl font-bold text-red-900 mt-2">
                        {formatCurrency((reportData?.TotalProductCost as number) || 0)}
                      </p>
                    </div>

                    {/*
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
                        <p className="text-sm font-medium text-indigo-600 ml-2">Gross Income</p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900 mt-2">
                        {formatCurrency((reportData?.GrossIncome as number) || 0)}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
                        <p className="text-sm font-medium text-indigo-600 ml-2">Net Income</p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900 mt-2">
                        {formatCurrency((reportData?.NetIncome as number) || 0)}
                      </p>
                    </div>
                    */}
                  </div>
                )}
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h4 className="text-md font-medium text-gray-900">Sales Trends</h4>
              </div>
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <label htmlFor="trend-grouping" className="mr-2 font-medium">Group by:</label>
                  <select
                    id="trend-grouping"
                    value={trendGrouping}
                    onChange={e => {
                      setTrendGrouping(e.target.value as 'day' | 'week' | 'month');
                    }}
                    className="border rounded px-2 py-1"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                {Array.isArray(salesTrends) && salesTrends.length > 0 ? (
                  <ApexCharts
                    type="line"
                    height={250}
                    options={{
                      chart: { id: 'sales-trends' },
                      xaxis: {
                        categories: salesTrends.map((item: any) =>
                          trendGrouping === 'week' ? formatWeek(item.period) : item.period
                        ),
                        title: { text: trendGrouping === 'day' ? 'Date' : trendGrouping.charAt(0).toUpperCase() + trendGrouping.slice(1) }
                      },
                      yaxis: {
                        title: { text: 'Total Sales' },
                        labels: { formatter: (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                      },
                      stroke: { curve: 'smooth' },
                      dataLabels: { enabled: false },
                      tooltip: { y: { formatter: (val: number) => `LKR ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } }
                    }}
                    series={[
                      {
                        name: 'Total Sales',
                        data: salesTrends.map((item: any) => item.total_sales)
                      }
                    ]}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>No sales data for this period.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h4 className="text-md font-medium text-gray-900">Top Products</h4>
              </div>
              <div className="card-body">
                <DataTable
                  columns={topProductsColumns}
                  data={topProducts}
                  progressPending={topProductsLoading}
                  pagination
                  paginationServer
                  paginationTotalRows={topProductsTotal}
                  paginationPerPage={topProductsPerPage}
                  onChangePage={handleTopProductsPageChange}
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={<div className="text-center py-8 text-gray-500">No top selling products found for this period.</div>}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 