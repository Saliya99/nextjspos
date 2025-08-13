'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useRoleBasedNavigation } from '../../hooks/useRoleBasedNavigation'
import { User, NavigationItem } from '../../types'
import {
  ShoppingCartIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navigation = useRoleBasedNavigation()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Smart Retailer</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <SidebarContent pathname={pathname} logout={logout} user={user} navigation={navigation} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <ShoppingCartIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">Smart Retailer</h1>
            </div>
          </div>
          <SidebarContent pathname={pathname} logout={logout} user={user} navigation={navigation} />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md bg-white shadow-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}

function SidebarContent({ pathname, logout, user, navigation }: { pathname: string, logout: () => void, user: User | null, navigation: NavigationItem[] }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const getExpandedItems = () => {
    const autoExpanded = navigation
      .filter(item => item.submenu && item.submenu.some(subItem => pathname === subItem.href))
      .map(item => item.name)
    
    return Array.from(new Set([...expandedItems, ...autoExpanded]))
  }

  const navigationItems = useMemo(() => 
    navigation.map((item) => {
      const isActive = pathname === item.href || (item.submenu && item.submenu.some(subItem => pathname === subItem.href))
      const isExpanded = getExpandedItems().includes(item.name)
      const hasSubmenu = item.submenu && item.submenu.length > 0

      return (
        <div key={item.name}>
          {hasSubmenu ? (
            <div
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => toggleExpanded(item.name)}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span className="flex-1">{item.name}</span>
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          ) : (
            <Link
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-6 w-6 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span className="flex-1">{item.name}</span>
            </Link>
          )}
          
          {hasSubmenu && isExpanded && item.submenu && (
            <div className="ml-6 space-y-1">
              {item.submenu.map((subItem) => {
                const isSubActive = pathname === subItem.href
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isSubActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-400'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <subItem.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isSubActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {subItem.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }), [pathname, navigation, expandedItems]
  )

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigationItems}
        </nav>
      </div>
    </div>
  )
}