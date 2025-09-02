'use client'

import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../lib/api'
import { SearchProductResult, Customer, PaymentMethod } from '../types'

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProductResult[]>([])
  const [productPage, setProductPage] = useState(1)
  const [searchCustomerTerm, setSearchCustomerTerm] = useState('')
  const [customerList, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [shopIsGrn, setShopIsGrn] = useState<boolean | null>(null)

  const fetchShopIsGrn = useCallback(async () => {
    try {
      const response = await apiClient.getShopProfile()
      if (response.success && response.data) {
        setShopIsGrn(response.data.isGrn ?? true)
      }
    } catch (error) {
      setShopIsGrn(true)
    }
  }, [])

  const searchProducts = useCallback(async (page = 1, append = false) => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await apiClient.searchProductsWithGRN(searchTerm, {
        page,
        per_page: 10,
        paginate: true,
        is_grn: shopIsGrn ?? undefined
      })

      if (append) {
        setSearchResults(prev => [...prev, ...response.data])
      } else {
        setSearchResults(response.data)
      }
    } catch (error) {
      console.error('Failed to search products:', error)
      toast.error('Failed to search products. Please try again.')
      if (!append) setSearchResults([])
    }
  }, [searchTerm, shopIsGrn])

  const getCustomers = useCallback(async () => {
    if (!searchCustomerTerm.trim() || searchCustomerTerm.length < 2) {
      setCustomers([])
      return
    }

    setLoadingCustomers(true)
    try {
      const customerList = await apiClient.searchCustomers(searchCustomerTerm)
      if (searchCustomerTerm.trim()) {
        setCustomers(customerList.data || [])
      }
    } catch (error) {
      console.error('Failed to search customer:', error)
      toast.error('Failed to search customer. Please try again.')
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }, [searchCustomerTerm])

  const clearProductSearch = useCallback(() => {
    setSearchTerm('')
    setSearchResults([])
  }, [])

  const clearCustomerSearch = useCallback(() => {
    setSearchCustomerTerm('')
    setCustomers([])
  }, [])

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const response = await apiClient.getPaymentMethods();
        if (response.data) {
          setPaymentMethods(response.data);
        }
      } catch (error) {
        toast.error('Failed to load payment methods');
      }
    }
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    fetchShopIsGrn()
  }, [fetchShopIsGrn])

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    productPage,
    setProductPage,
    searchCustomerTerm,
    setSearchCustomerTerm,
    customerList,
    loadingCustomers,
    searchProducts,
    getCustomers,
    clearProductSearch,
    clearCustomerSearch,
    paymentMethods,
    shopIsGrn
  }
}