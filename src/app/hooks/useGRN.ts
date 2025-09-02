'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { apiClient } from '../lib/api'
import { Supplier, PaymentMethod, GRNItemWithTemp, Product } from '../types'
import { grnSchema } from '../lib/schemas'

type GRNFormData = z.infer<typeof grnSchema>

export function useGRN() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [items, setItems] = useState<GRNItemWithTemp[]>([])
  const [grnNumber, setGrnNumber] = useState('')
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState(0)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)

  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GRNFormData>({
    resolver: zodResolver(grnSchema),
    defaultValues: {
      grnDate: new Date().toISOString().split('T')[0],
    },
  })

  const supplierName = watch('supplierName')
  const invoiceNumber = watch('invoiceNumber')
  const grnNote = watch('grnNote')

  useEffect(() => {
    const generatedNumber = Math.floor(100000 + Math.random() * 900000)
    setGrnNumber(generatedNumber.toString())
  }, [])

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const supplierList = await apiClient.getSuppliers()
        setSuppliers(supplierList)
        setFilteredSuppliers(supplierList)
      } catch (error) {
        toast.error('Failed to load suppliers.')
        setSuppliers([])
        setFilteredSuppliers([])
      } finally {
        setLoadingSuppliers(false)
      }
    }
    loadSuppliers()
  }, [])

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await apiClient.getPaymentMethods()
        if (response.success && response.data) {
          setPaymentMethods(response.data)
        } else {
          setPaymentMethods([])
        }
      } catch (error) {
        toast.error('Failed to load payment methods.')
        setPaymentMethods([])
      } finally {
        setLoadingPaymentMethods(false)
      }
    }
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    if (supplierSearchTerm.trim()) {
      const filtered = suppliers.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      )
      setFilteredSuppliers(filtered)
    } else {
      setFilteredSuppliers(suppliers)
    }
  }, [suppliers, supplierSearchTerm])

  useEffect(() => {
    if (productSearchTerm.trim()) {
      const filtered = supplierProducts.filter(product => {
        const productName = product.productName || ''
        const productNumber = product.productNumber || ''
        return (
          productName.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          productNumber.toLowerCase().includes(productSearchTerm.toLowerCase())
        )
      })
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(supplierProducts)
    }
  }, [supplierProducts, productSearchTerm])

  useEffect(() => {
    const loadAllProducts = async () => {
      setLoadingProducts(true)
      try {
        const res = await apiClient.getAllProducts({
          paginate: false,
          include_grn: false
        })
        if (res.success && res.data) {
          setSupplierProducts(res.data)
        } else {
          setSupplierProducts([])
        }
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to load products.'
        toast.error(message)
        setSupplierProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    loadAllProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showSupplierDropdown && !target.closest('.supplier-dropdown')) {
        setShowSupplierDropdown(false)
      }
      if (showProductDropdown && !target.closest('.product-dropdown')) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSupplierDropdown, showProductDropdown])

  const handleSupplierSelect = (supplier: Supplier) => {
    setValue('supplierName', supplier.supplier_name)
    setSupplierSearchTerm(supplier.supplier_name)
    setShowSupplierDropdown(false)
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.productId)
    setProductSearchTerm(product.productName || '')
    setShowProductDropdown(false)

    const costInput = document.querySelector('[placeholder="Enter cost price"]') as HTMLInputElement
    const sellingInput = document.querySelector('[placeholder="Enter selling price"]') as HTMLInputElement

    if (costInput) costInput.value = product.productCost && product.productCost > 0 ? product.productCost.toString() : ''
    if (sellingInput) sellingInput.value = product.productSelling && product.productSelling > 0 ? product.productSelling.toString() : ''
  }

  const handleAddItem = () => {
    const costInput = document.querySelector('[placeholder="Enter cost price"]') as HTMLInputElement
    const sellingInput = document.querySelector('[placeholder="Enter selling price"]') as HTMLInputElement
    const qtyInput = document.querySelector('[placeholder="Enter quantity"]') as HTMLInputElement
    const reorderMarginInput = document.querySelector('[placeholder="Enter reorder margin"]') as HTMLInputElement

    const cost = Number(costInput?.value || 0)
    const selling = Number(sellingInput?.value || 0)
    const qty = Number(qtyInput?.value || 0)
    const reorderMargin = Number(reorderMarginInput?.value || 0)

    if (!costInput?.value.trim()) {
      toast.error('Cost Price is required')
      return
    }
    if (!sellingInput?.value.trim()) {
      toast.error('Selling Price is required')
      return
    }
    if (!qtyInput?.value.trim()) {
      toast.error('Quantity is required')
      return
    }

    if (cost <= 0) {
      toast.error('Cost Price must be greater than 0')
      return
    }
    if (selling <= 0) {
      toast.error('Selling Price must be greater than 0')
      return
    }
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    const selectedProduct = supplierProducts.find(p => p.productId === selectedProductId)
    const name = selectedProduct?.productName || 'Unknown Product'

    const newItem: GRNItemWithTemp = {
      grnItemsId: 0,
      productId: selectedProductId,
      costPrice: cost,
      sellingPrice: selling,
      orderedQty: qty,
      quantity: qty,
      tempId: Date.now(),
      name: name,
      reorderMargin: reorderMargin
    }

    setItems([...items, newItem])

    if (costInput) costInput.value = ''
    if (sellingInput) sellingInput.value = ''
    if (qtyInput) qtyInput.value = ''
    if (reorderMarginInput) reorderMarginInput.value = ''

    setSelectedProductId(0)
    setProductSearchTerm('')
    setShowProductDropdown(false)

    toast.success('Item added successfully!')
  }

  const removeItem = (tempId: number) => {
    setItems(items.filter((item) => item.tempId !== tempId))
  }

  const handleCancelGRN = () => {
    setItems([])
    setValue('supplierName', '')
    setValue('invoiceNumber', '')
    setValue('grnNote', '')
    setSupplierSearchTerm('')
    setShowSupplierDropdown(false)
    setSelectedProductId(0)
    setProductSearchTerm('')
    setShowProductDropdown(false)
    setSelectedPaymentMethodId(null)

    const costInput = document.querySelector('[placeholder="Enter cost price"]') as HTMLInputElement
    const sellingInput = document.querySelector('[placeholder="Enter selling price"]') as HTMLInputElement
    const qtyInput = document.querySelector('[placeholder="Enter quantity"]') as HTMLInputElement
    const reorderMarginInput = document.querySelector('[placeholder="Enter reorder margin"]') as HTMLInputElement

    if (costInput) costInput.value = ''
    if (sellingInput) sellingInput.value = ''
    if (qtyInput) qtyInput.value = ''
    if (reorderMarginInput) reorderMarginInput.value = ''

    const generatedNumber = Math.floor(100000 + Math.random() * 900000)
    setGrnNumber(generatedNumber.toString())

    toast.success('GRN cancelled successfully!')
  }

  const handleFinalizeGRN = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one item.')
      return
    }
    if (!supplierName || !invoiceNumber) {
      toast.error('Please fill required fields: Supplier and Invoice Number.')
      return
    }
    if (!selectedPaymentMethodId) {
      toast.error('Please select a payment method.')
      return
    }

    const selectedSupplier = suppliers.find(s => s.supplier_name === supplierName)
    if (!selectedSupplier) {
      toast.error('Please select a valid supplier.')
      return
    }

    try {
      const selectedPayMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId)
      if (!selectedPayMethod) {
        toast.error('Invalid payment method selected.')
        return
      }
      const grnData = {
        supplier_id: selectedSupplier.supplier_id,
        invoice_id: invoiceNumber,
        grn_datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        payment_type: selectedPayMethod.method,
        pay_method_id: selectedPaymentMethodId,
        note: grnNote || '',
        items: items.map(item => ({
          item_id: item.productId,
          qty: item.quantity,
          cost_price: item.costPrice,
          selling_price: item.sellingPrice,
          re_order_margin: item.reorderMargin
        }))
      }

      const response = await apiClient.createGrnWithItems(grnData)

      if (response.success) {
        toast.success('GRN finalized and saved successfully!')
        setItems([])
        setValue('supplierName', '')
        setValue('invoiceNumber', '')
        setValue('grnNote', '')
        setSupplierSearchTerm('')
        setShowSupplierDropdown(false)
        setSelectedProductId(0)
        setProductSearchTerm('')
        setShowProductDropdown(false)

        const costInput = document.querySelector('[placeholder="Enter cost price"]') as HTMLInputElement
        const sellingInput = document.querySelector('[placeholder="Enter selling price"]') as HTMLInputElement
        const qtyInput = document.querySelector('[placeholder="Enter quantity"]') as HTMLInputElement
        const reorderMarginInput = document.querySelector('[placeholder="Enter reorder margin"]') as HTMLInputElement

        if (costInput) costInput.value = ''
        if (sellingInput) sellingInput.value = ''
        if (qtyInput) qtyInput.value = ''
        if (reorderMarginInput) reorderMarginInput.value = ''

        const generatedNumber = Math.floor(100000 + Math.random() * 900000)
        setGrnNumber(generatedNumber.toString())
      } else {
        throw new Error(response.message || 'Failed to create GRN')
      }
    } catch (error) {
      toast.error('Failed to save GRN. Please try again.')
    }
  }

  const selectedSupplier = suppliers.find((s) => s.supplier_name === supplierName)
  const totalCost = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)

  return {
    suppliers,
    loadingSuppliers,
    items,
    grnNumber,
    supplierProducts,
    selectedProductId,
    loadingProducts,
    paymentMethods,
    loadingPaymentMethods,
    selectedPaymentMethodId,
    filteredSuppliers,
    supplierSearchTerm,
    showSupplierDropdown,
    filteredProducts,
    productSearchTerm,
    showProductDropdown,
    selectedSupplier,
    totalCost,

    register,
    watch,
    setValue,
    errors,
    supplierName,
    invoiceNumber,
    grnNote,

    handleSupplierSelect,
    handleProductSelect,
    handleAddItem,
    removeItem,
    handleCancelGRN,
    handleFinalizeGRN,

    setSupplierSearchTerm,
    setShowSupplierDropdown,
    setSelectedProductId,
    setProductSearchTerm,
    setShowProductDropdown,
    setSelectedPaymentMethodId,
  }
} 