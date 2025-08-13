'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/layout/SideBar'
import Header from '../components/layout/Header'
import ProtectedRoute from '../components/ProtectedRoute'
import FormField from '../components/forms/FormField'
import { UserIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { apiClient } from '../lib/api'
import { settingsSchema, SettingsFormData } from '../lib/schemas'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUserAvatar } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      email: '',
      role: ''
    }
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        role: user.role || ''
      })
    }
  }, [user, reset])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const response = await apiClient.updateAuthUser(
        data.name,
        data.email,
        data.role
      )
      if (response.success == true) {
        toast.success('Profile updated successfully!')
        reset(data)
      } else {
        toast.error('Failed to update profile: ' + response.message)
      }
    } catch (error) {
      toast.error('Failed to update profile. Please try again.')
    }
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const response = await apiClient.uploadAvatar(
        file,
        user?.id?.toString() || ''
      )

      if (response.success) {
        if (response.data?.avatar_url) {
          updateUserAvatar(response.data.avatar_url)
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setAvatarPreview(null)
      } else {
        toast.error('Failed to upload avatar: ' + response.message)
      }
    } catch (error) {
      toast.error('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = () => {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Settings" subtitle="Manage system settings" />

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'profile' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      User Profile
                    </button>
                  </nav>
                </div>
              </div>

              <div className="lg:col-span-3">
                {activeTab === 'profile' && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-lg font-medium">User Profile</h3>
                    </div>
                    <div className="card-body">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-3">Profile Picture</label>
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="h-20 w-20 bg-primary-600 rounded-full flex items-center justify-center">
                                {avatarPreview ? (
                                  <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="h-20 w-20 rounded-full object-cover"
                                  />
                                ) : user?.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt="User avatar"
                                    className="h-20 w-20 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl font-medium text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              {avatarPreview && (
                                <button
                                  onClick={removeAvatar}
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
                                onChange={handleAvatarChange}
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
                                  {isUploading ? 'Uploading...' : 'Upload Avatar'}
                                </button>
                                {isUploading && (
                                  <div className="text-sm text-blue-600">
                                    Uploading...
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Supported formats: JPG, PNG, GIF. Max size: 5MB
                              </p>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            label="Name"
                            error={errors.name}
                            {...register('name')}
                            type="text"
                            placeholder="Enter your name"
                            required
                          />

                          <FormField
                            label="Email"
                            error={errors.email}
                            {...register('email')}
                            type="email"
                            placeholder="Enter your email"
                            required
                          />

                          <FormField
                            label="Role"
                            error={errors.role}
                            {...register('role')}
                            type="text"
                            disabled
                            required
                          />

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary"
                          >
                            {isSubmitting ? 'Updating...' : 'Update Profile'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}