'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, BuildingOfficeIcon, XMarkIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import FormField from '../components/forms/FormField'
import { apiClient } from '../lib/api'
import { Supplier } from '../types'
import { supplierSchema, SupplierFormData } from '../lib/schemas'
import DataTable from 'react-data-table-component';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [showUpdateSupplierModal, setUpdateSupplierModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema)
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const supplierList = await apiClient.getSuppliers()
      setSuppliers(supplierList)
      setFilteredSuppliers(supplierList)
    } catch {
      console.error('Failed to load suppliers')
      setSuppliers([])
      setFilteredSuppliers([])
      alert('Failed to load suppliers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setFilteredSuppliers(suppliers)
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(value.toLowerCase()) ||
        supplier.supplier_contact_number.includes(value)
      )
      setFilteredSuppliers(filtered)
    }
  }

  const addNewSupplier = async (data: SupplierFormData) => {
    try {
      const response = await apiClient.addNewSupplier(
        0, // Auto-generate ID
        data.supplier_name,
        data.supplier_address,
        data.supplier_contact_number
      );
      if (response.success) {
        toast.success('Supplier added successfully!');
        setShowAddSupplierModal(false);
        reset();
        loadSuppliers();
      } else {
        toast.error('Failed to add supplier. ' + response.message);
      }
    } catch {
      toast.error('Failed to add supplier. Please try again.');
    }
  };

  const columns = [
    { name: 'Name', selector: (row: Supplier) => row.supplier_name },
    { name: 'Address', selector: (row: Supplier) => row.supplier_address },
    { name: 'Contact Number', selector: (row: Supplier) => row.supplier_contact_number },
    {
      name: 'Actions', selector: (row: Supplier) => row.supplier_name, cell: (row: Supplier) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="btn btn-sm btn-outline"
            aria-label={`Edit supplier ${row.supplier_name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      )
    },
  ];

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplierId(supplier.supplier_id);
    reset({
      supplier_name: supplier.supplier_name,
      supplier_address: supplier.supplier_address || '',
      supplier_contact_number: supplier.supplier_contact_number || '',
    });
    setUpdateSupplierModal(true);
  };

  const AddSupplierModal = () => {
    reset({
      supplier_name: '',
      supplier_address: '',
      supplier_contact_number: '',
    });
    setShowAddSupplierModal(true);
  }


  const EditSupplier = async (updateSupplier: SupplierFormData) => {
    if (!editingSupplierId) {
      toast.error('No supplier selected for editing');
      return;
    }
    
    setLoading(true)
    try {
      const response = await apiClient.editSupplier(
        editingSupplierId,
        updateSupplier.supplier_name,
        updateSupplier.supplier_address,
        updateSupplier.supplier_contact_number,
      )
      if (response.success) {
        toast.success('Supplier updated successfully!')
        setUpdateSupplierModal(false)
        setEditingSupplierId(null)
        reset()
        loadSuppliers()
      } else {
        toast.error('Failed to update supplier. ' + response.message)
      }
    } catch (error) {
      console.error('Failed to update supplier:', error)
      toast.error('Failed to update supplier. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Supplier Management"
          subtitle="Manage your suppliers"
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="card mb-6">
            <div className="card-body">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search suppliers by name or phone numbers..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="input pl-10 w-full"
                    aria-label="Search suppliers"
                  />
                </div>
                <button
                  onClick={() => AddSupplierModal()}
                  className="btn btn-primary"
                  aria-label="Add new supplier"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Supplier
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredSuppliers.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredSuppliers}
                  pagination
                  responsive
                />
              ) : (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers</h3>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Add Product Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Supplier</h3>
              <button
                onClick={() => {
                  setShowAddSupplierModal(false);
                  reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(addNewSupplier)} className="space-y-4">
              <FormField
                label="Name"
                type="text"
                error={errors.supplier_name}
                required
                {...register('supplier_name')}
              />
              <FormField
                label="Address"
                type="text"
                error={errors.supplier_address}
                required
                {...register('supplier_address')}
              />
              <FormField
                label="Contact Number"
                type="text"
                error={errors.supplier_contact_number}
                required
                {...register('supplier_contact_number')}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1"
                >
                  {isSubmitting ? 'Adding...' : 'Add Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    reset();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showUpdateSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Update Supplier</h3>
              <button
                onClick={() => {
                  setUpdateSupplierModal(false);
                  setEditingSupplierId(null);
                  reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(EditSupplier)} className="space-y-4">
              <FormField
                label="Name"
                type="text"
                error={errors.supplier_name}
                required
                {...register('supplier_name')}
              />
              <FormField
                label="Address"
                type="text"
                error={errors.supplier_address}
                required
                {...register('supplier_address')}
              />
              <FormField
                label="Contact Number"
                type="text"
                error={errors.supplier_contact_number}
                required
                {...register('supplier_contact_number')}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1"
                >
                  {isSubmitting ? 'Updating...' : 'Update Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUpdateSupplierModal(false);
                    setEditingSupplierId(null);
                    reset();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}