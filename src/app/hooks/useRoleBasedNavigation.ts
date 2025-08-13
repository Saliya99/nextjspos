import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { NavigationItem } from '../types'
import {
  HomeIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TagIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

const allNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin'] },
  { name: 'POS', href: '/pos', icon: ShoppingCartIcon, roles: ['admin', 'cashier'] },
  { 
    name: 'Products', 
    href: '/products', 
    icon: CubeIcon, 
    roles: ['admin', 'cashier'],
    submenu: [
      { name: 'All Products', href: '/products', icon: TagIcon },
      { name: 'Product Categories', href: '/products/categories', icon: TagIcon },
      { name: 'Product Brands', href: '/products/brands', icon: TagIcon },
    ]
  },
  { name: 'Customers', href: '/customers', icon: UsersIcon, roles: ['admin', 'cashier'] },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['admin', 'cashier'] },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon, roles: ['admin', 'cashier', 'storekeeper'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  { name: 'GRN', href: '/grn', icon: ClipboardDocumentListIcon, roles: ['admin', 'storekeeper'] },
]

export function useRoleBasedNavigation() {
  const { user } = useAuth()
  
  const navigation = useMemo(() => {
    if (!user) return []
    
    return allNavigation.filter(item => 
      item.roles.includes(user.role)
    )
  }, [user])
  
  return navigation
}
