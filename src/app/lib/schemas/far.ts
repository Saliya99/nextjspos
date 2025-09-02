import { z } from 'zod'

// Asset Form Schema
export const assetSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  dateOfPurchase: z.string().min(1, 'Date of purchase is required'),
  cost: z.string().min(1, 'Cost is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Cost must be a positive number'
  ),
  location: z.string().min(1, 'Location is required'),
  source: z.string().min(1, 'Source is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  ownership: z.enum(['Owned', 'Leased', 'Donated'], {
    required_error: 'Ownership type is required'
  }),
  category: z.string().min(1, 'Category is required'),
  depreciationRate: z.string().min(1, 'Depreciation rate is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
    'Depreciation rate must be between 0 and 100'
  ),
  usefulLife: z.string().min(1, 'Useful life is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Useful life must be a positive number'
  )
})

// User Role Schema
export const userRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['Admin', 'Accountant', 'Auditor'], {
    required_error: 'Role is required'
  })
})

export type AssetFormData = z.infer<typeof assetSchema>
export type UserRoleFormData = z.infer<typeof userRoleSchema>