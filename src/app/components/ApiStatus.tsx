'use client'

import { useState, useEffect } from 'react'
import config from '../lib/config'

interface ApiStatusProps {
  className?: string
}

export default function ApiStatus({ className = '' }: ApiStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    checkApiStatus()
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkApiStatus = async () => {
    setStatus('checking')

    if (!config.apiUrl) {
      setStatus('error')
      setLastCheck(new Date())
      return
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(config.apiUrl, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      clearTimeout(timeoutId)
      setStatus('connected')
    } catch {
      setStatus('error')
    }
    
    setLastCheck(new Date())
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: '🔄',
          text: 'Checking...',
          description: 'Testing API connection'
        }
      case 'connected':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: '✅',
          text: 'Connected',
          description: 'Backend server is available'
        }

      case 'error':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: '❌',
          text: 'API Offline',
          description: 'Backend server unavailable'
        }
    }
  }

  const statusInfo = getStatusInfo()

  if (!config.enableDebugLogs) {
    return null // Hide in production
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color} ${className}`}>
      <span className="mr-1">{statusInfo.icon}</span>
      <span>{statusInfo.text}</span>
      {lastCheck && (
        <span className="ml-2 opacity-75">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
      <div className="ml-2">
        <button
          onClick={checkApiStatus}
          className="opacity-60 hover:opacity-100 transition-opacity"
          title={statusInfo.description}
        >
          🔄
        </button>
      </div>
    </div>
  )
}