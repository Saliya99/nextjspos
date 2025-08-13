import { useEffect } from 'react'
import { UseFormWatch } from 'react-hook-form'

interface UseAutoSaveProps<T = Record<string, unknown>> {
  watch: UseFormWatch<T>
  onSave: (data: T) => void
  delay?: number
  key: string
}

export function useAutoSave<T = Record<string, unknown>>({ watch, onSave, delay = 2000, key }: UseAutoSaveProps<T>) {
  const watchedData = watch()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(watchedData).some(k => watchedData[k])) {
        localStorage.setItem(`autosave_${key}`, JSON.stringify(watchedData))
        onSave(watchedData)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [watchedData, onSave, delay, key])

  const clearAutoSave = () => {
    localStorage.removeItem(`autosave_${key}`)
  }

  const loadAutoSave = () => {
    const saved = localStorage.getItem(`autosave_${key}`)
    return saved ? JSON.parse(saved) : null
  }

  return { clearAutoSave, loadAutoSave }
}