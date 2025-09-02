import { useRef } from 'react'
import { InvoiceData, ShopConfig } from '../types'
import { apiClient } from '../lib/api'

export const useThermalPrint = () => {
  const printRef = useRef<HTMLDivElement>(null)

  const fetchShopConfig = async (): Promise<ShopConfig> => {
    try {
      const response = await apiClient.getShopProfile()
      if (response.success && response.data) {
        return {
          shop_id: response.data.shopId,
          shop_name: response.data.shopName,
          shop_email: response.data.shopEmail,
          shop_tel: response.data.shopMobile,
          shop_landline: response.data.shopLandline,
          address_line1: response.data.addressLine1,
          address_line2: response.data.addressLine2,
          address_line3: response.data.addressLine3,
          receipt_config: {
            tax_label: 'VAT',
            show_tax_number: false,
            tax_number: response.data.taxNumber,
            business_reg_number: response.data.brNumber,
            logo_path: response.data.logoUrl
          }
        }
      }
      throw new Error('No shop data')
    } catch (error) {
      console.error('Failed to fetch shop config:', error)
      return {
        shop_id: 1,
        shop_name: 'Smart Retailer Store',
        shop_email: 'info@smartretailer.com',
        shop_tel: '033 225 9334',
        address_line1: '123 Main St',
        address_line2: 'City, Country',
        address_line3: '12345',
        receipt_config: {
          tax_label: 'VAT',
          show_tax_number: false
        }
      }
    }
  }

  const printThermalReceipt = async (shopId: number, invoiceData: InvoiceData) => {
    try {
      const shopConfig = await fetchShopConfig()
      sessionStorage.setItem('thermalPrintData', JSON.stringify({ shopConfig, invoiceData }))
      window.dispatchEvent(new CustomEvent('thermalPrint', { detail: { shopConfig, invoiceData } }))
    } catch (error) {
      console.error('Print failed:', error)
      throw error
    }
  }

  return {
    printRef,
    printThermalReceipt,
    fetchShopConfig
  }
}