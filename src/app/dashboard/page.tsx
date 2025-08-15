'use client'

import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import ProtectedRoute from '../components/ProtectedRoute'
import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api'
import { DashboardStats, RecentOrder } from '../types'
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import DataTable from 'react-data-table-component'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await apiClient.getDashboardStats()
      setStats(dashboardStats)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDashboardCards = () => [
    { 
      name: 'Today\'s Sales', 
      value: `LKR ${stats?.todayRevenue || '0'}`, 
      icon: CurrencyDollarIcon,
      change: '+12.5%',
      changeType: 'increase',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      description: 'Total revenue today'
    },
    { 
      name: 'Invoices', 
      value: stats?.invoiceCount || '0', 
      icon: ShoppingCartIcon,
      change: '+8.2%',
      changeType: 'increase',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      description: 'Orders processed today'
    },
    { 
      name: 'Customers', 
      value: stats?.customerCount || '0', 
      icon: UsersIcon,
      change: '+15.3%',
      changeType: 'increase',
      color: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      description: 'Active customers today'
    },
    { 
      name: 'Items Sold', 
      value: stats?.soldItemCount || '0', 
      icon: ChartBarIcon,
      change: '+5.7%',
      changeType: 'increase',
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      description: 'Products sold today'
    },
  ]

  const columns = [
    { 
      name: 'Invoice ID', 
      selector: (row: RecentOrder) => `#${row.invoice_id}`,
      cell: (row: RecentOrder) => (
        <span className="font-mono text-sm font-semibold text-gray-900">
          #{row.invoice_id}
        </span>
      ),
      width: '120px'
    },
    { 
      name: 'Customer', 
      selector: (row: RecentOrder) => row.customer_name,
      cell: (row: RecentOrder) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {row.customer_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-gray-900">{row.customer_name}</span>
        </div>
      ),
      width: '200px'
    },
    { 
      name: 'Amount', 
      selector: (row: RecentOrder) => row.grand_total,
      cell: (row: RecentOrder) => (
        <span className="font-semibold text-green-600">
          LKR {parseFloat(row.grand_total).toLocaleString()}
        </span>
      ),
      width: '150px'
    },
    {
      name: 'Status',
      cell: () => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
          Completed
        </span>
      ),
      width: '120px'
    }
  ]

  const recentOrders = stats?.todayRecentOrders || []

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Dashboard"
            subtitle={`Welcome back, ${user?.name || 'User'}! Here's what's happening today.`}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {/* Welcome Banner */}
            <div className="mb-8 relative overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90 rounded-2xl"></div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <SparklesIcon className="h-8 w-8 mr-3 animate-pulse" />
                        Welcome to Smart Retailer
                      </h1>
                      <p className="text-blue-100 text-lg font-medium">
                        Your comprehensive POS management system
                      </p>
                      <p className="text-blue-200 text-sm mt-2">
                        Manage your business with ease and efficiency
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <ShoppingCartIcon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ))
              ) : (
                getDashboardCards().map((stat, index) => (
                  <div key={stat.name} className="group relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02]">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                            <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                              stat.changeType === 'increase' 
                                ? 'text-green-700 bg-green-100' 
                                : 'text-red-700 bg-red-100'
                            }`}>
                              {stat.changeType === 'increase' ? (
                                <ArrowUpIcon className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDownIcon className="h-3 w-3 mr-1" />
                              )}
                              {stat.change}
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.description}</p>
                        </div>
                        <div className={`h-12 w-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
                    <p className="text-2xl font-bold text-green-600">LKR {stats?.monthlyRevenue || '0'}</p>
                    <p className="text-sm text-gray-500">This month's total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Average Order</h3>
                    <p className="text-2xl font-bold text-blue-600">LKR 2,450</p>
                    <p className="text-sm text-gray-500">Per transaction</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <TrendingUpIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Growth Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">+18.5%</p>
                    <p className="text-sm text-gray-500">vs last month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <p className="text-sm text-gray-600">Latest transactions from today</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500">Live updates</span>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden">
                <DataTable
                  columns={columns}
                  data={recentOrders}
                  pagination
                  paginationPerPage={5}
                  paginationRowsPerPageOptions={[5, 10, 15]}
                  responsive
                  highlightOnHover
                  pointerOnHover
                  customStyles={{
                    table: {
                      style: {
                        backgroundColor: 'transparent',
                      },
                    },
                    headRow: {
                      style: {
                        backgroundColor: 'transparent',
                        borderBottom: '1px solid rgb(229 231 235 / 0.5)',
                      },
                    },
                    headCells: {
                      style: {
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#6B7280',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                      },
                    },
                    cells: {
                      style: {
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                      },
                    },
                    rows: {
                      style: {
                        borderBottom: '1px solid rgb(229 231 235 / 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgb(249 250 251 / 0.5)',
                        },
                      },
                    },
                  }}
                  noDataComponent={
                    <div className="text-center py-12">
                      <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No recent orders</h3>
                      <p className="mt-1 text-sm text-gray-500">Orders will appear here as they come in</p>
                    </div>
                  }
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}