'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import FormField from '../forms/FormField'
import { AddCustomerModalProps } from '../../types'

export default function AddCustomerModal({
  isOpen,
  onClose,
  onSubmit,
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onReset
}: AddCustomerModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
    onReset()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add New Customer</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="First Name"
            type="text"
            error={errors.first_Name}
            required
            {...register('first_Name')}
          />
          <FormField
            label="Last Name"
            type="text"
            error={errors.last_Name}
            required
            {...register('last_Name')}
          />
          <FormField
            label="Address"
            type="text"
            error={errors.address}
            required
            {...register('address')}
          />
          <FormField
            label="Contact Number"
            type="tel"
            error={errors.contactNumber}
            required
            {...register('contactNumber')}
          />
          <FormField
            label="Email"
            type="email"
            error={errors.email}
            required
            {...register('email')}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}