// Fixed Asset Register Types
export interface FixedAsset {
  id: number
  description: string
  serialNumber: string
  dateOfPurchase: string
  cost: number
  location: string
  accumulatedDepreciation: number
  writtenDownValue: number
  source: string
  supplier: string
  ownership: 'Owned' | 'Leased' | 'Donated'
  category: string
  status: 'Active' | 'Disposed' | 'Under Maintenance'
  depreciationRate: number
  usefulLife: number
  createdAt: string
  updatedAt: string
}

export interface AssetCategory {
  id: number
  name: string
  depreciationRate: number
  usefulLife: number
}

export interface DepreciationEntry {
  id: number
  assetId: number
  assetDescription: string
  year: number
  openingValue: number
  depreciationAmount: number
  closingValue: number
  method: 'Straight Line' | 'Reducing Balance'
  createdAt: string
}

export interface AssetFormData {
  description: string
  serialNumber: string
  dateOfPurchase: string
  cost: string
  location: string
  source: string
  supplier: string
  ownership: 'Owned' | 'Leased' | 'Donated'
  category: string
  depreciationRate: string
  usefulLife: string
}

export interface UserRole {
  id: number
  name: string
  permissions: string[]
  description: string
}

export interface FARUser {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Accountant' | 'Auditor'
  permissions: string[]
  isActive: boolean
  createdAt: string
}