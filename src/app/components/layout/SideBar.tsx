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
  SparklesIcon,
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
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart Retailer
              </h1>
              <p className="text-xs text-gray-500 font-medium">POS System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <SidebarContent pathname={pathname} logout={logout} user={user} navigation={navigation} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50">
          <div className="flex items-center h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <ShoppingCartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Retailer
                </h1>
                <p className="text-xs text-gray-500 font-medium">POS System</p>
              </div>
            </div>
          </div>
          <SidebarContent pathname={pathname} logout={logout} user={user} navigation={navigation} />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-xl bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50 text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200 hover:shadow-xl"
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
        <div key={item.name} className="relative">
          {hasSubmenu ? (
            <div
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900'
              }`}
              onClick={() => toggleExpanded(item.name)}
            >
              <item.icon
                className={`mr-4 flex-shrink-0 h-6 w-6 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                }`}
              />
              <span className="flex-1 font-semibold">{item.name}</span>
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRightIcon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              )}
            </div>
          ) : (
            <Link
              href={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 hover:transform hover:scale-[1.01]'
              }`}
            >
              <item.icon
                className={`mr-4 flex-shrink-0 h-6 w-6 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                }`}
              />
              <span className="flex-1 font-semibold">{item.name}</span>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              )}
            </Link>
          )}
          
          {hasSubmenu && isExpanded && item.submenu && (
            <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
              {item.submenu.map((subItem) => {
                const isSubActive = pathname === subItem.href
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isSubActive
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300'
                    }`}
                  >
                    <subItem.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                        isSubActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <span className="font-medium">{subItem.name}</span>
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
      <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
        {/* User Info Card */}
        <div className="mx-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="h-12 w-12 object-cover rounded-xl"
                />
              ) : (
                <span className="text-lg font-semibold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-600 flex items-center">
                <SparklesIcon className="h-3 w-3 mr-1" />
                <span className="capitalize">{user?.role || 'Guest'}</span>
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigationItems}
        </nav>
      </div>
    </div>
  )
}