import { z } from 'zod'

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

// Customer Schema
export const customerSchema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  contactNumber: z.string().min(1, 'Contact number is required').regex(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number'),
  address: z.string().min(1, 'Address is required'),
  companyName: z.string().optional(),
  clientType: z.string().optional(),
  nic: z.string().optional()
})

// Product Schema
export const productSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  productLocation: z.string().min(1, 'Product location is required'),
  productDetails: z.string().optional(),
  productType: z.string().min(1, 'Product type is required'),
  productCost: z.string().min(1, 'Cost is required'),
  productSelling: z.string().min(1, 'Selling price is required'),
  productQty: z.string().min(1, 'Quantity is required'),
  brandId: z.number().optional(),
  categoryId: z.number().optional()
})

// Supplier Schema
export const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_contact_number: z.string().min(1, 'Contact number is required').regex(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number'),
  supplier_address: z.string().min(1, 'Address is required')
})

// GRN Schema
export const grnSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  grnNumber: z.string().min(1, 'GRN number is required'),
  grnNote: z.string().optional(),
  grnDate: z.string().min(1, 'GRN date is required')
})

// Invoice Schema
export const invoiceSchema = z.object({
  clientId: z.number().min(1, 'Customer is required'),
  vat: z.number().min(0).max(100, 'VAT must be between 0 and 100'),
  discount: z.number().min(0).max(100, 'Discount must be between 0 and 100')
})

// Search Schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search term is required')
})

// Date Range Schema
export const dateRangeSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required')
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate']
})

// Settings Schema
export const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Role is required')
})

// Export types
export type LoginFormData = z.infer<typeof loginSchema>
export type CustomerFormData = z.infer<typeof customerSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type SupplierFormData = z.infer<typeof supplierSchema>
export type GRNFormData = z.infer<typeof grnSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type DateRangeFormData = z.infer<typeof dateRangeSchema>
export type SettingsFormData = z.infer<typeof settingsSchema>