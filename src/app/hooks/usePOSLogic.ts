'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getCookie, setCookie } from 'react-use-cookie'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/api'
import { SearchProductResult, CartItem, Customer, InvoiceCalculation, PaymentMethod } from '../types'

export function usePOSLogic() {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
  const [vatPercentage, setVatPercentage] = useState(0)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addToCart = useCallback((product: SearchProductResult) => {
    if (product.grnData && product.grnData.length > 0) {
      const availableGrnItem = product.grnData.find(grn => grn.quantity && grn.quantity > 0)

      if (!availableGrnItem) {
        toast.error('Product is out of stock')
        return
      }

      const grnItemsId = availableGrnItem.grnItemsId
      const availableQty = availableGrnItem.quantity || 0
      const sellingPrice = availableGrnItem.sellingPrice || product.productSelling || 0

      const existingItem = cart.find(item => item.grnItemsId === grnItemsId)

      if (existingItem) {
        if (availableQty <= existingItem.quantity) {
          toast.error('Insufficient stock available')
          return
        } else {
          setCart(prev => prev.map(item =>
            item.grnItemsId === grnItemsId
              ? { ...item, quantity: item.quantity + 1, total: (item.sellingPrice - item.discount) * (item.quantity + 1) }
              : item
          ))
          toast.success('Product quantity updated')
        }
      } else {
        const newItem: CartItem = {
          grnItemsId: grnItemsId,
          productId: product.productId,
          productName: product.productName,
          productNumber: product.productNumber,
          quantity: 1,
          sellingPrice: sellingPrice,
          discount: 0,
          total: sellingPrice,
          productQty: availableQty,
        }
        setCart(prev => [...prev, newItem])
        toast.success('Product added to cart')
      }
    } else {
      const productQty = product.productQty || 0
      const sellingPrice = product.productSelling || 0

      const uniqueGrnId = null

      const existingItem = cart.find(item =>
        item.grnItemsId === uniqueGrnId && item.productId === product.productId
      )

      if (existingItem) {
        if (productQty <= existingItem.quantity) {
          toast.error('Insufficient stock available')
          return
        } else {
          setCart(prev => prev.map(item =>
            item.grnItemsId === uniqueGrnId && item.productId === product.productId
              ? { ...item, quantity: item.quantity + 1, total: (item.sellingPrice - item.discount) * (item.quantity + 1) }
              : item
          ))
          toast.success('Product quantity updated')
        }
      } else {
        const newItem: CartItem = {
          grnItemsId: uniqueGrnId,
          productId: product.productId,
          productName: product.productName,
          productNumber: product.productNumber,
          quantity: 1,
          sellingPrice: sellingPrice,
          discount: 0,
          total: sellingPrice,
          productQty: productQty,
        }
        setCart(prev => [...prev, newItem])
        toast.success('Product added to cart')
      }
    }
  }, [cart])

  const updateCartItemQuantity = useCallback((productId: number, newQuantity: number, grnItemsId: number, productQty: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.grnItemsId !== grnItemsId))
      return
    }

    if (productQty < newQuantity) {
      toast.error('Out of Stock')
      return
    }

    setCart(prev => prev.map(item =>
      item.grnItemsId === grnItemsId
        ? {
          ...item,
          quantity: newQuantity,
          total: (item.sellingPrice - item.discount) * newQuantity
        }
        : item
    ))
  }, [])

  const updateCartItemDiscount = useCallback((productId: number, discount: number) => {
    setCart(prev => prev.map(item =>
      item.productId === productId
        ? {
          ...item,
          discount,
          total: (item.sellingPrice - discount) * item.quantity
        }
        : item
    ))
  }, [])

  const removeFromCart = useCallback((productId: number, grnItemsId: number) => {
    setCart(prev => prev.filter(item => item.grnItemsId !== grnItemsId))
  }, [])

  const calculateTotals = useCallback((): InvoiceCalculation => {
    const subtotalBeforeDiscounts = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
    const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
    const subtotalAfterItemDiscounts = subtotalBeforeDiscounts - itemDiscounts
    const subtotalDiscountAmount = (subtotalAfterItemDiscounts * discountPercentage) / 100
    const netAmountAfterAllDiscounts = subtotalAfterItemDiscounts - subtotalDiscountAmount
    const vatAmount = (netAmountAfterAllDiscounts * vatPercentage) / 100
    const grandTotal = netAmountAfterAllDiscounts + vatAmount

    return {
      subtotal: subtotalAfterItemDiscounts,
      vatAmount,
      discountAmount: subtotalDiscountAmount,
      grandTotal: Math.max(0, grandTotal)
    }
  }, [cart, vatPercentage, discountPercentage])

  const createInvoice = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart')
      return null
    }

    setLoading(true)
    setError(null)
    try {
      let invoice_id = currentInvoiceId

      if (!invoice_id) {
        const clientName = selectedCustomer
          ? `${selectedCustomer.first_Name || ''} ${selectedCustomer.last_Name || ''}`.trim()
          : 'Walk-in Customer'

        const response = await apiClient.createInvoice(
          clientName,
          selectedCustomer?.email || '',
          selectedCustomer?.contactNumber || '',
          selectedCustomer?.id || 0,
          user?.id.toString() || '1'
        )

        if (response.result && response.invoiceId) {
          invoice_id = response.invoiceId
          setCurrentInvoiceId(invoice_id)
        } else {
          throw new Error('Invalid response from server')
        }
      }

      if (invoice_id !== null) {
        for (const item of cart) {
          await apiClient.addItemToCart(
            invoice_id,
            user?.id.toString() || '1',
            item.productId,
            item.quantity.toString(),
            item.discount.toString(),
            item.sellingPrice.toString(),
            item.grnItemsId || null
          )
        }

        if (vatPercentage > 0) {
          await apiClient.updateInvoiceVat(invoice_id, vatPercentage.toString())
        }
        if (discountPercentage > 0) {
          await apiClient.updateInvoiceDiscount(invoice_id, discountPercentage.toString())
        }
      }

      const invoiceDetails = {
        invoice_id,
        items: cart,
        customer: selectedCustomer,
        totals: calculateTotals(),
        vatPercentage,
        discountPercentage,
        discountAmount: calculateTotals().discountAmount,
        paymentMethods,
        createdAt: new Date().toISOString()
      }

      setCart([])
      setCurrentInvoiceId(null)
      return invoiceDetails
    } catch (error) {
      console.error('Failed to create invoice:', error)
      toast.error('Failed to create invoice. Please try again.')
      setError('Failed to create invoice. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [cart, selectedCustomer, user, currentInvoiceId, vatPercentage, discountPercentage, paymentMethods, calculateTotals])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedCustomer(null)
    setVatPercentage(0)
    setDiscountPercentage(0)
    setPaymentMethods([])
    setCurrentInvoiceId(null)
  }, [])

  const holdInvoice = useCallback(() => {
    const storedInvoices = getCookie('holdInvoice') ? JSON.parse(getCookie('holdInvoice')) : []
    const totals = calculateTotals()

    // Ensure we have a valid grandTotal
    const grandTotal = totals.grandTotal > 0 ? totals.grandTotal : 
      cart.reduce((sum, item) => sum + item.total, 0) + 
      (cart.reduce((sum, item) => sum + item.total, 0) * vatPercentage / 100) - 
      (cart.reduce((sum, item) => sum + item.total, 0) * discountPercentage / 100)

    const newInvoice = {
      contact: selectedCustomer?.contactNumber || '',
      customer: selectedCustomer,
      userId: user?.id.toString() || '1',
      Product: cart,
      vatPercentage: vatPercentage,
      discountPercentage: discountPercentage,
      grandTotal: Math.max(0, grandTotal)
    }

    storedInvoices.push(newInvoice)
    setCookie('holdInvoice', JSON.stringify(storedInvoices))
    toast.success('Invoice moved to hold list')
    clearCart()
  }, [selectedCustomer, user, cart, vatPercentage, discountPercentage, clearCart, calculateTotals])

  const getInvoiceByIndex = useCallback((index: number) => {
    const cookie = getCookie('holdInvoice')
    if (!cookie) return

    try {
      const invoices = JSON.parse(cookie)
      if (!Array.isArray(invoices) || index < 0 || index >= invoices.length) return

      const invoice = invoices[index]
      setCart(invoice?.Product || [])
      setSelectedCustomer(invoice?.customer || null)
      setVatPercentage(invoice?.vatPercentage || 0)
      setDiscountPercentage(invoice?.discountPercentage || 0)
      setPaymentMethods(invoice?.paymentMethods || [])

      toast.success('Invoice restored from hold list!')
    } catch (e) {
      console.error('Error parsing holdInvoice cookie:', e)
    }
  }, [])

  const restoreInvoiceToCart = useCallback((invoiceData: any) => {
    setCart(invoiceData.items || [])
    setSelectedCustomer(invoiceData.customer || null)
    setVatPercentage(invoiceData.vatPercentage || 0)
    setDiscountPercentage(invoiceData.discountPercentage || 0)
    setCurrentInvoiceId(invoiceData.invoice_id)
    toast.success('Invoice restored to cart for editing!')
  }, [])

  return {
    cart,
    selectedCustomer,
    setSelectedCustomer,
    paymentMethods,
    setPaymentMethods,
    paymentMethodId,
    setPaymentMethodId,
    vatPercentage,
    setVatPercentage,
    discountPercentage,
    setDiscountPercentage,
    loading,
    error,
    addToCart,
    updateCartItemQuantity,
    updateCartItemDiscount,
    removeFromCart,
    calculateTotals,
    createInvoice,
    clearCart,
    holdInvoice,
    getInvoiceByIndex,
    restoreInvoiceToCart
  }
}