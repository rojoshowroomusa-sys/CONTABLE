'use client'

import { useState } from 'react'

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  data: any[]
  filename: string
}

export function useExport() {
  const [exporting, setExporting] = useState(false)

  const exportData = async ({ format, data, filename }: ExportOptions) => {
    setExporting(true)

    try {
      let content: string
      let mimeType: string
      let extension: string

      switch (format) {
        case 'csv':
          if (data.length === 0) { setExporting(false); return }
          const headers = Object.keys(data[0]).join(',')
          const rows = data.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')).join('\n')
          content = `${headers}\n${rows}`
          mimeType = 'text/csv'
          extension = 'csv'
          break
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          extension = 'json'
          break
        default:
          setExporting(false)
          return
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  return { exportData, exporting }
}
