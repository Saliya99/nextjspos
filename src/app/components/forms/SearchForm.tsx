import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { searchSchema, SearchFormData } from '../../lib/schemas'

interface SearchFormProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export default function SearchForm({ onSearch, placeholder = 'Search...', className = '' }: SearchFormProps) {
  const { register, watch } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    mode: 'onChange'
  })

  const searchQuery = watch('query', '')

  // Trigger search on every change
  React.useEffect(() => {
    onSearch(searchQuery || '')
  }, [searchQuery, onSearch])

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="input pl-10 w-full"
        {...register('query')}
      />
    </div>
  )
}