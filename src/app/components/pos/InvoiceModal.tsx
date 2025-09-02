'use client'

import { useRef, useState, useEffect } from 'react'
import DataTable from 'react-data-table-component'
import { XMarkIcon, PrinterIcon, PlusIcon, PauseIcon } from '@heroicons/react/24/outline'
import { ExtendedInvoiceModalProps, ShopConfig } from '../../types'
import ThermalReceipt from '../thermal-receipt/ThermalReceipt'
import { apiClient } from '../../lib/api'

export default function InvoiceModal({ isOpen, onClose, onAddMore, onPrint, invoiceData, onHoldInvoice, onDeleteInvoice, onRestoreToCart }: ExtendedInvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null)

  useEffect(() => {
    const fetchShopConfig = async () => {
      if (!isOpen || shopConfig) return
      try {
        const response = await apiClient.getShopProfile()
        if (response.success && response.data) {
          setShopConfig({
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
          })
        }
      } catch (error) {
        console.error('Failed to fetch shop config:', error)
      }
    }
    fetchShopConfig()
  }, [isOpen, shopConfig])

  const handlePrint = async () => {
    if (!invoiceData || !printRef.current || !shopConfig) return

    try {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt</title>
              <style>
                @media print {
                  @page { size: 80mm auto; margin: 0; padding: 0; }
                  body { 
                    margin: 0; 
                    padding: 0;
                    width: 80mm;
                  }
                  * {
                    margin: 0;
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body onload="window.print(); setTimeout(() => window.close(), 100);">
              ${printRef.current.innerHTML}
            </body>
          </html>
        `)
        doc.close()
      }

      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        } catch (error) {
          console.warn('Failed to remove iframe:', error)
        }
      }, 200)

      onPrint()
      onClose()
    } catch (error) {
      console.error('Print failed:', error)
    }
  }

  if (!isOpen || !invoiceData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <h3 className="text-lg font-medium">Invoice #{invoiceData.invoice_id}</h3>
          <button onClick={() => {
            if (onDeleteInvoice) onDeleteInvoice()
            onClose()
          }} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]" id="invoice-content">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">{shopConfig?.shop_name || 'Loading...'}</h2>
            <p className="text-gray-600">
              {shopConfig?.address_line1 && <>{shopConfig.address_line1}<br /></>}
              {shopConfig?.address_line2 && <>{shopConfig.address_line2}<br /></>}
              {shopConfig?.address_line3 && <>{shopConfig.address_line3}</>}
              {!shopConfig?.address_line1 && !shopConfig?.address_line2 && !shopConfig?.address_line3 && 'Loading address...'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium mb-2">Invoice Details</h4>
              <p>Invoice #: {invoiceData.invoice_id}</p>
              <p>Date: {new Date(invoiceData.createdAt).toLocaleDateString()}</p>
              <p>Time: {new Date(invoiceData.createdAt).toLocaleTimeString()}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Customer</h4>
              <p>{invoiceData.customer ?
                `${invoiceData.customer.first_Name} ${invoiceData.customer.last_Name}` :
                'Walk-in Customer'
              }</p>
              {invoiceData.customer?.email && <p>{invoiceData.customer.email}</p>}
              {invoiceData.customer?.contactNumber && <p>{invoiceData.customer.contactNumber}</p>}
            </div>
          </div>

          <div className="mb-6">
            <DataTable
              columns={[
                {
                  name: 'Item',
                  selector: (row: any) => row.productName,
                  cell: (row: any) => (
                    <div>
                      <p className="font-medium">{row.productName}</p>
                      <p className="text-sm text-gray-500">{row.productNumber}</p>
                    </div>
                  ),
                  width: '300px'
                },
                {
                  name: 'Qty',
                  selector: (row: any) => row.quantity,
                  right: true,
                  width: '80px'
                },
                {
                  name: 'Price',
                  selector: (row: any) => row.sellingPrice,
                  cell: (row: any) => `LKR ${row.sellingPrice.toFixed(2)}`,
                  right: true,
                  width: '120px'
                },
                ...(invoiceData.items.some((item: any) => item.discount > 0) ? [{
                  name: 'Discount',
                  selector: (row: any) => row.discount,
                  cell: (row: any) => `LKR ${row.discount.toFixed(2)}`,
                  right: true,
                  width: '120px'
                }] : []),
                {
                  name: 'Total',
                  selector: (row: any) => row.total,
                  cell: (row: any) => `LKR ${row.total.toFixed(2)}`,
                  right: true,
                  width: '120px'
                }
              ]}
              data={invoiceData.items}
              dense
              noHeader
              fixedHeader
              fixedHeaderScrollHeight="200px"
              customStyles={{
                table: {
                  style: {
                    border: '1px solid #d1d5db'
                  }
                },
                headRow: {
                  style: {
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #d1d5db'
                  }
                },
                rows: {
                  style: {
                    borderBottom: '1px solid #d1d5db'
                  }
                }
              }}
            />
          </div>

                     <div className="flex justify-end">
             <div className="w-64">
               <div className="flex justify-between py-1">
                 <span>Subtotal:</span>
                 <span>LKR {invoiceData.totals.subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between py-1">
                 <span>Discount ({invoiceData.discountPercentage}%):</span>
                 <span>-LKR {invoiceData.totals.discountAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between py-1">
                 <span>VAT ({invoiceData.vatPercentage}%):</span>
                 <span>LKR {invoiceData.totals.vatAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between py-2 border-t font-bold text-lg">
                 <span>Total:</span>
                 <span>LKR {invoiceData.totals.grandTotal.toFixed(2)}</span>
               </div>
             </div>
           </div>

          <div className="flex flex-col gap-3 mt-6 print:hidden">
            <button onClick={handlePrint} className="btn btn-success w-full">
              <PrinterIcon className="h-5 w-5" />
              Print & Save
            </button>
            <button onClick={() => {
              if (onHoldInvoice) onHoldInvoice()
              onClose()
            }} className="btn btn-warning w-full">
              <PauseIcon className="h-5 w-5" />
              Hold Invoice
            </button>
            <button onClick={() => {
              if (onRestoreToCart) onRestoreToCart()
              onAddMore()
            }} className="btn btn-primary w-full">
              <PlusIcon className="h-5 w-5" />
              Add More Items
            </button>
          </div>

          <div className="text-center mt-8 text-sm text-gray-600">
            <p>Thank you for your business!</p>
          </div>
        </div>

        <div ref={printRef} style={{ display: 'none' }}>
          {invoiceData && shopConfig && (
            <ThermalReceipt
              shopConfig={shopConfig}
              invoiceData={invoiceData}
            />
          )}
        </div>
      </div>
    </div>
  )
}