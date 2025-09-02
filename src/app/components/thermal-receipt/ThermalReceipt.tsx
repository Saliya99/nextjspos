'use client'

import React, { useMemo } from 'react'
import { ThermalReceiptProps } from '../../types'

const CHARS_PER_LINE = 48

function generateSeparatorLine(char: string, length?: number): string {
  const lineLength = length || CHARS_PER_LINE
  return char.repeat(lineLength)
}

const RECEIPT_CONSTANTS = {
  THANK_YOU: 'THANK YOU COME AGAIN',
  SOFTWARE_CREDIT: {
    BY: 'SOFTWARE BY: AMAZOFT',
    PHONE: '076 441 5555',
    WEBSITE: 'www.amazoft.com'
  }
} as const

const STYLES = {
  receipt: {
    width: '80mm',
    fontFamily: 'Courier New, monospace',
    fontSize: '8pt',
    lineHeight: '1.2',
    backgroundColor: 'white',
    color: 'black',
    '@media print': {
      border: 'none',
      outline: 'none'
    }
  },
  sinhala: {
    fontFamily: 'Samantha, Noto Sans Sinhala, serif',
    fontSize: '11pt'
  },
  header: {
    fontFamily: 'Samantha, Noto Sans Sinhala, serif',
    fontSize: '11pt',
    fontWeight: 'bold' as const
  },
  poppins: {
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: '8pt'
  },
  poppinsBold: {
    fontFamily: 'Poppins, Arial, sans-serif',
    fontSize: '8pt',
    fontWeight: 'bold' as const
  },
  arialBold: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '8pt',
    fontWeight: 'bold' as const
  },
  monospaced: {
    fontFamily: 'Courier New, monospace',
    fontSize: '8pt'
  }
} as const

function parseProductName(productName: string) {
  const openParen = productName.indexOf('(')
  const closeParen = productName.indexOf(')')

  if (openParen === -1 || closeParen === -1 || closeParen <= openParen) {
    return { name: productName, code: '' }
  }

  return {
    name: productName.substring(0, openParen).trim(),
    code: productName.substring(openParen, closeParen + 1)
  }
}

export default function ThermalReceipt({ shopConfig, invoiceData }: ThermalReceiptProps) {

  const separatorLine = useMemo(() => generateSeparatorLine('-', Math.floor(CHARS_PER_LINE * 0.99)), [])
  const starLine = useMemo(() => generateSeparatorLine('*'), [])

  return (
    <>
      <div style={STYLES.receipt}>
        <div style={{ textAlign: 'center', ...STYLES.monospaced }}>
          {separatorLine}
        </div>

        <div style={{ textAlign: 'center', ...STYLES.header, marginTop: '1pt' }}>
          {shopConfig.shop_name}
        </div>

        <div style={{ textAlign: 'center', ...STYLES.sinhala, marginTop: '1pt' }}>
          {shopConfig.address_line1 && <div>{shopConfig.address_line1}</div>}
          {shopConfig.address_line2 && <div>{shopConfig.address_line2}</div>}
          {shopConfig.address_line3 && <div>{shopConfig.address_line3}</div>}

        </div>

        <div style={{ textAlign: 'center', ...STYLES.arialBold, marginTop: '1pt' }}>
          {shopConfig.shop_tel} / {shopConfig.shop_landline}
        </div>

        <div style={{ textAlign: 'center', ...STYLES.monospaced, marginTop: '1pt' }}>
          {separatorLine}
        </div>

        <div style={{ marginTop: '1pt', ...STYLES.poppinsBold }}>
          <div>Invoice: {(invoiceData.invoice_id)}</div>
          <div>Date: {new Date(invoiceData.createdAt).toLocaleDateString()}</div>
          {invoiceData.customer && (
            <div>Client: {invoiceData.customer.first_Name} {invoiceData.customer.last_Name}</div>
          )}
        </div>

        <div style={{ textAlign: 'center', ...STYLES.monospaced, marginTop: '1pt' }}>
          {separatorLine}
        </div>
        <div style={{ ...STYLES.arialBold, marginTop: '1pt', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ width: '20%', textAlign: 'left' }}>Item</span>
          <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
          <span style={{ width: '20%', textAlign: 'right' }}>Price</span>
          <span style={{ width: '20%', textAlign: 'right' }}>Disc</span>
          <span style={{ width: '15%', textAlign: 'right' }}>Total</span>
        </div>
        <div style={{ textAlign: 'center', ...STYLES.monospaced }}>
          {separatorLine}
        </div>

        <div style={{ marginTop: '1pt' }}>
          {invoiceData.items.map((item, index) => {
            const { name, code } = parseProductName(item.productName)

            return (
              <div key={index} style={{ marginBottom: '1pt' }}>
                <div style={{ ...STYLES.poppins }}>
                  <div style={{ textAlign: 'left', wordWrap: 'break-word', marginBottom: '1pt' }}>
                    {name} {code}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ width: '20%', textAlign: 'left' }}></span>
                    <span style={{ width: '15%', textAlign: 'right' }}>{item.quantity}</span>
                    <span style={{ width: '20%', textAlign: 'right' }}>{item.sellingPrice.toFixed(2)}</span>
                    <span style={{ width: '20%', textAlign: 'right' }}>{(item.discount || 0).toFixed(2)}</span>
                    <span style={{ width: '15%', textAlign: 'right' }}>{item.total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', ...STYLES.monospaced, marginTop: '1pt' }}>
                  {separatorLine}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '1pt', ...STYLES.poppinsBold }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <span>Sub Total:</span>
            <span>{invoiceData.totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <span>Discount ({invoiceData.discountPercentage}%):</span>
            <span>-{(invoiceData.totals.subtotal * invoiceData.discountPercentage / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <span>VAT ({invoiceData.vatPercentage}%):</span>
            <span>{invoiceData.totals.vatAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <span>Grand Total:</span>
            <span>{invoiceData.totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', ...STYLES.monospaced, marginTop: '1pt' }}>
          {separatorLine}
        </div>

        <div style={{ textAlign: 'center', ...STYLES.monospaced, fontWeight: 'bold', marginTop: '3pt' }}>
          <div>{starLine}</div>
          <div>       {RECEIPT_CONSTANTS.THANK_YOU}       </div>
          <div>{starLine}</div>
        </div>

        <div style={{ textAlign: 'center', ...STYLES.poppins, marginTop: '2pt' }}>
          <div>{RECEIPT_CONSTANTS.SOFTWARE_CREDIT.BY}</div>
          <div>{RECEIPT_CONSTANTS.SOFTWARE_CREDIT.PHONE}</div>
          <div>{RECEIPT_CONSTANTS.SOFTWARE_CREDIT.WEBSITE}</div>
        </div>

      </div>
    </>
  )
}