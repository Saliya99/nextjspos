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
import { FARUser } from '../../types/far'
import { userRoleSchema, UserRoleFormData } from '../../lib/schemas/far'
import { exportToCSV, exportToExcel } from '../../lib/exportService'
import {
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

const mockUsers: FARUser[] = [
  {
    id: 1,
    name: 'John Admin',
    email: 'admin@company.com',
    role: 'Admin',
    permissions: ['create_assets', 'edit_assets', 'delete_assets', 'view_reports', 'manage_users'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Sarah Accountant',
    email: 'sarah@company.com',
    role: 'Accountant',
    permissions: ['create_assets', 'edit_assets', 'view_reports', 'calculate_depreciation'],
    isActive: true,
    createdAt: '2024-02-10T10:00:00Z'
  },
  {
    id: 3,
    name: 'Mike Auditor',
    email: 'mike@company.com',
    role: 'Auditor',
    permissions: ['view_assets', 'view_reports', 'export_data'],
    isActive: true,
    createdAt: '2024-03-05T10:00:00Z'
  }
]

const rolePermissions = {
  'Admin': ['create_assets', 'edit_assets', 'delete_assets', 'view_reports', 'manage_users', 'calculate_depreciation', 'export_data'],
  'Accountant': ['create_assets', 'edit_assets', 'view_reports', 'calculate_depreciation', 'export_data'],
  'Auditor': ['view_assets', 'view_reports', 'export_data']
}

export default function FARUsersPage() {
  const [users, setUsers] = useState<FARUser[]>(mockUsers)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingUser, setEditingUser] = useState<FARUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<FARUser | null>(null)
  const [viewingUser, setViewingUser] = useState<FARUser | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserRoleFormData>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Auditor'
    }
  })

  const selectedRole = watch('role')

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const onSubmit = async (data: UserRoleFormData) => {
    try {
      const permissions = rolePermissions[data.role as keyof typeof rolePermissions] || []
      
      const newUser: FARUser = {
        id: editingUser ? editingUser.id : Date.now(),
        name: data.name,
        email: data.email,
        role: data.role as 'Admin' | 'Accountant' | 'Auditor',
        permissions: permissions,
        isActive: editingUser ? editingUser.isActive : true,
        createdAt: editingUser ? editingUser.createdAt : new Date().toISOString()
      }

      if (editingUser) {
        setUsers(prev => prev.map(user => user.id === editingUser.id ? newUser : user))
        toast.success('User updated successfully!')
      } else {
        setUsers(prev => [...prev, newUser])
        toast.success('User added successfully!')
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error('Failed to save user. Please try again.')
    }
  }

  const resetForm = () => {
    reset()
    setEditingUser(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (user: FARUser) => {
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('role', user.role)
    setEditingUser(user)
    setShowModal(true)
  }

  const openViewModal = (user: FARUser) => {
    setViewingUser(user)
    setShowViewModal(true)
  }

  const openDeleteModal = (user: FARUser) => {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    try {
      setUsers(prev => prev.filter(user => user.id !== deletingUser.id))
      toast.success('User deleted successfully!')
      setShowDeleteModal(false)
      setDeletingUser(null)
    } catch (error) {
      toast.error('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ))
    toast.success('User status updated successfully!')
  }

  const handleExportToCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = filteredUsers.map(user => ({
        'Name': user.name,
        'Email': user.email,
        'Role': user.role,
        'Status': user.isActive ? 'Active' : 'Inactive',
        'Permissions': user.permissions.join(', '),
        'Created Date': new Date(user.createdAt).toLocaleDateString()
      }))

      await exportToCSV(csvData, {
        filename: `far_users_${new Date().toISOString().split('T')[0]}.csv`
      })
      toast.success('Users exported to CSV successfully!')
    } catch (error) {
      toast.error('Failed to export users')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const excelData = filteredUsers.map(user => ({
        'Name': user.name,
        'Email': user.email,
        'Role': user.role,
        'Status': user.isActive ? 'Active' : 'Inactive',
        'Permissions': user.permissions.join(', '),
        'Created Date': new Date(user.createdAt).toLocaleDateString()
      }))

      await exportToExcel(excelData, {
        filename: `far_users_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'FAR Users'
      })
      toast.success('Users exported to Excel successfully!')
    } catch (error) {
      toast.error('Failed to export users')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-danger">Inactive</span>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      'Admin': 'badge-danger',
      'Accountant': 'badge-primary',
      'Auditor': 'badge-warning'
    }
    return <span className={`badge ${colors[role as keyof typeof colors] || 'badge-secondary'}`}>{role}</span>
  }

  const columns = useMemo(() => [
    {
      name: 'User',
      selector: (row: FARUser) => row.name,
      sortable: true,
      cell: (row: FARUser) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Role',
      selector: (row: FARUser) => row.role,
      sortable: true,
      cell: (row: FARUser) => getRoleBadge(row.role),
      width: '120px',
    },
    {
      name: 'Status',
      selector: (row: FARUser) => row.isActive ? 'Active' : 'Inactive',
      sortable: true,
      cell: (row: FARUser) => getStatusBadge(row.isActive),
      width: '100px',
    },
    {
      name: 'Permissions',
      selector: (row: FARUser) => row.permissions.length,
      sortable: true,
      cell: (row: FARUser) => (
        <span className="text-gray-600">
          {row.permissions.length} permission{row.permissions.length !== 1 ? 's' : ''}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'Created',
      selector: (row: FARUser) => row.createdAt,
      sortable: true,
      cell: (row: FARUser) => (
        <span className="text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'Actions',
      cell: (row: FARUser) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openViewModal(row)}
            className="btn btn-sm btn-outline text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400"
            title="View User"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="btn btn-sm btn-outline"
            title="Edit User"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleUserStatus(row.id)}
            className={`btn btn-sm btn-outline ${
              row.isActive 
                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300 hover:border-orange-400'
                : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300 hover:border-green-400'
            }`}
            title={row.isActive ? 'Deactivate User' : 'Activate User'}
          >
            <ShieldCheckIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="btn btn-sm btn-outline text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
            title="Delete User"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      width: '180px',
      sortable: false,
    },
  ], [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="FAR User Management"
            subtitle="Manage user roles and permissions for Fixed Asset Register"
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
                      placeholder="Search users by name, email, or role..."
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
                    Add User
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    FAR Users ({filteredUsers.length})
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
                  data={filteredUsers}
                  pagination
                  responsive
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={
                    <div className="text-center py-12">
                      <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm ? 'No users found' : 'No users available'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? 'Try adjusting your search terms.'
                          : 'Get started by adding your first user.'
                        }
                      </p>
                    </div>
                  }
                />
              </div>
            </div>

            {/* Role Permissions Info */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Role Permissions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(rolePermissions).map(([role, permissions]) => (
                    <div key={role} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <ShieldCheckIcon className="h-5 w-5 text-primary-600 mr-2" />
                        <h4 className="font-semibold text-gray-900">{role}</h4>
                      </div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {permissions.map(permission => (
                          <li key={permission} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                            {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            {users.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Users
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {users.length}
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
                        <UsersIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Users
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {users.filter(user => user.isActive).length}
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
                        <UsersIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Admins
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {users.filter(user => user.role === 'Admin').length}
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
                        <UsersIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Accountants
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {users.filter(user => user.role === 'Accountant').length}
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

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label="Full Name"
                  error={errors.name}
                  {...register('name')}
                  type="text"
                  required
                />
                
                <FormField
                  label="Email Address"
                  error={errors.email}
                  {...register('email')}
                  type="email"
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    {...register('role')}
                    className="input w-full"
                    required
                  >
                    <option value="Auditor">Auditor</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>

                {selectedRole && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2">
                      {selectedRole} Permissions:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {rolePermissions[selectedRole as keyof typeof rolePermissions]?.map(permission => (
                        <li key={permission} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary flex-1"
                  >
                    {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
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

        {/* View User Modal */}
        {showViewModal && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">User Details</h3>
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
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <UsersIcon className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {viewingUser.name}
                    </h4>
                    <p className="text-gray-500">{viewingUser.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      {getRoleBadge(viewingUser.role)}
                      {getStatusBadge(viewingUser.isActive)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-1 gap-2">
                        {viewingUser.permissions.map(permission => (
                          <div key={permission} className="flex items-center">
                            <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm text-gray-700">
                              {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created Date
                    </label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {new Date(viewingUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
        {showDeleteModal && deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-red-600">Delete User</h3>
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
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      Are you sure you want to delete this user?
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {deletingUser.name} ({deletingUser.email})
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">
                    This action cannot be undone. The user will be permanently removed from the system.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="btn btn-danger flex-1"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete User'}
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