import * as ExcelJS from 'exceljs'
import Papa from 'papaparse'

export interface ExportData {
  [key: string]: string | number | null | undefined
}

export interface ExportOptions {
  filename?: string
  sheetName?: string
  headers?: string[]
}

export const exportToCSV = async (
  data: ExportData[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    if (data.length === 0) {
      throw new Error('No data to export')
    }

    const csv = Papa.unparse(data, {
      header: true,
      delimiter: ',',
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      newline: '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = options.filename || `export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    throw error
  }
}

export const exportToExcel = async (
  data: ExportData[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    if (data.length === 0) {
      throw new Error('No data to export')
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(options.sheetName || 'Data')

    const headers = options.headers || Object.keys(data[0])
    
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: Math.max(header.length * 1.5, 15)
    }))

    worksheet.addRows(data)

    const excelBuffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = options.filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    throw error
  }
} 
