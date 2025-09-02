'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import FormField from '../forms/FormField'
import { CameraIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { apiClient } from '../../lib/api'
import { shopProfileSchema, ShopProfileFormData } from '../../lib/schemas'
import toast from 'react-hot-toast'

export default function ShopProfile() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ShopProfileFormData>({
    resolver: zodResolver(shopProfileSchema),
    defaultValues: {
      shopName: '',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      shopLandline: undefined,
      shopMobile: '',
      shopEmail: '',
      taxNumber: undefined,
      brNumber: undefined,
      currency: 'LKR'
    }
  })

  const loadShopProfile = useCallback(async () => {
    try {
      const response = await apiClient.getShopProfile()
      if (response.success && response.data) {
        reset(response.data)
        setCurrentLogo(response.data.logoUrl)
      } else {
        // Use default values if no shop profile exists
        const defaultData = {
          shopName: 'Smart Retailer Store',
          addressLine1: '123 Main Street',
          addressLine2: 'City',
          addressLine3: 'Country',
          shopLandline: '+94112345678',
          shopMobile: '+94771234567',
          shopEmail: 'info@smartretailer.com',
          taxNumber: undefined,
          brNumber: undefined,
          currency: 'LKR',
        }
        reset(defaultData)
      }
    } catch (error) {
      toast.error('Failed to load shop profile')
    }
  }, [reset])

  useEffect(() => {
    loadShopProfile()
  }, [loadShopProfile])

  const onSubmit = async (data: ShopProfileFormData) => {
    try {
      // Convert null values to undefined for API compatibility
      const cleanedData = {
        ...data,
        addressLine2: data.addressLine2 || undefined,
        addressLine3: data.addressLine3 || undefined,
        shopLandline: data.shopLandline || undefined,
        taxNumber: data.taxNumber || undefined,
        brNumber: data.brNumber || undefined
      }
      const response = await apiClient.updateShopProfile(cleanedData)
      if (response.success) {
        toast.success('Shop profile updated successfully!')
        reset(data)
      } else {
        toast.error('Failed to update shop profile: ' + response.message)
      }
    } catch (error) {
      toast.error('Failed to update shop profile. Please try again.')
    }
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const response = await apiClient.uploadShopLogo(file)
      if (response.success) {
        toast.success('Logo uploaded successfully!')
        if (response.data?.logo_url) {
          setCurrentLogo(response.data.logo_url)
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setLogoPreview(null)
        // Reload shop profile to get updated logo
        loadShopProfile()
      } else {
        toast.error('Failed to upload logo: ' + response.message)
      }
    } catch (error) {
      toast.error('Failed to upload logo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium">Shop Profile</h3>
      </div>
      <div className="card-body">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Shop Logo</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : currentLogo ? (
                    <img
                      src={currentLogo}
                      alt="Shop logo"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                {logoPreview && (
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="btn btn-outline btn-sm"
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  {isUploading && (
                    <div className="text-sm text-blue-600">
                      Uploading...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 200x200px, JPG, PNG. Max size: 5MB
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="Shop Name"
              error={errors.shopName}
              {...register('shopName')}
              type="text"
              placeholder="Enter shop name"
              required
            />

            <FormField
              label="Address Line 1"
              error={errors.addressLine1}
              {...register('addressLine1')}
              type="text"
              placeholder="Enter street address"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Address Line 2"
                error={errors.addressLine2}
                {...register('addressLine2')}
                type="text"
                placeholder="Enter city (optional)"
              />

              <FormField
                label="Address Line 3"
                error={errors.addressLine3}
                {...register('addressLine3')}
                type="text"
                placeholder="Enter state/country (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Landline Number"
                error={errors.shopLandline}
                {...register('shopLandline')}
                type="tel"
                placeholder="Enter landline number (optional)"
              />

              <FormField
                label="Mobile Number"
                error={errors.shopMobile}
                {...register('shopMobile')}
                type="tel"
                placeholder="Enter mobile number"
                required
              />
            </div>

            <FormField
              label="Email Address"
              error={errors.shopEmail}
              {...register('shopEmail')}
              type="email"
              placeholder="Enter shop email address"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Tax Number"
                error={errors.taxNumber}
                {...register('taxNumber')}
                type="text"
                placeholder="Enter tax registration number (optional)"
              />

              <FormField
                label="Business Registration Number"
                error={errors.brNumber}
                {...register('brNumber')}
                type="text"
                placeholder="Enter business registration number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                {...register('currency')}
                className="input w-full"
                required
              >
                <option value="LKR">LKR - Sri Lankan Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Updating...' : 'Update Shop Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}