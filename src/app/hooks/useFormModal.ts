import { useState } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'

interface UseFormModalProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => Promise<void>
}

export function useFormModal<T extends FieldValues>({ form, onSubmit }: UseFormModalProps<T>) {
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null)

  const openAddModal = () => {
    form.reset()
    setEditingItem(null)
    setShowModal(true)
  }

  const openEditModal = (item: Record<string, unknown>, mapToForm: (item: Record<string, unknown>) => void) => {
    mapToForm(item)
    setEditingItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    form.reset()
    setEditingItem(null)
  }

  const handleSubmit = form.handleSubmit(async (data: T) => {
    await onSubmit(data)
    closeModal()
  })

  return {
    showModal,
    editingItem,
    openAddModal,
    openEditModal,
    closeModal,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting
  }
}