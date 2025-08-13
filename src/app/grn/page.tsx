'use client'

// import { useState } from 'react'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import ProtectedRoute from '../components/ProtectedRoute'

export default function GRNPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'storekeeper']}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Goods Received Note (GRN)"
            subtitle="Manage inventory receipts and stock updates"
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">GRN Management</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    GRN functionality will be implemented here
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}