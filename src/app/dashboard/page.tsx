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
  ChartBarIcon
} from '@heroicons/react/24/outline'
import DataTable from 'react-data-table-component';

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
    { name: 'Today Invoices', value: stats?.invoiceCount || '0', icon: ShoppingCartIcon },
    { name: 'Today Customers', value: stats?.customerCount || '0', icon: UsersIcon },
    { name: 'Today Items Sold', value: stats?.soldItemCount || '0', icon: ChartBarIcon },
    { name: 'Today Sale', value: `LKR ${stats?.todayRevenue || '0'}`, icon: CurrencyDollarIcon },
    { name: 'Monthly Sale', value: `LKR ${stats?.monthlyRevenue || '0'}`, icon: CurrencyDollarIcon },
  ]

  const columns = [
    { name: 'Invoice ID', selector: (row: RecentOrder) => row.invoice_id },
    { name: 'Customer', selector: (row: RecentOrder) => row.customer_name },
    { name: 'Grand Total', selector: (row: RecentOrder) => row.grand_total },
  ];

  const recentOrders = stats?.todayRecentOrders || []


  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Dashboard"
            subtitle={`Welcome back, ${user?.name || 'User'}!`}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="card animate-pulse">
                    <div className="card-body">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-300 rounded"></div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <div className="h-4 bg-gray-300 rounded mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                getDashboardCards().map((stat) => (
                  <div key={stat.name} className="card">
                    <div className="card-body">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <stat.icon className="h-8 w-8 text-primary-600" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {stat.name}
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {stat.value}
                              </div>
                              {/* <div className="ml-2 flex items-baseline text-sm font-semibold text-success-600">
                              {stat.change}
                            </div> */}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Welcome Message */}
            <div className="card mb-8">
              <div className="card-body text-center py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">WELCOME SMART RETAILER</h1>
                <p className="text-lg text-gray-600">Your comprehensive POS management system</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="card">
              {/* <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
            </div> */}
              <div className="card-body p-0">
                <div className="overflow-hidden">

                  <DataTable
                    title="Today Recent Invoices"
                    columns={columns}
                    data={recentOrders}
                    pagination
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}