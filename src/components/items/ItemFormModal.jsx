import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'

export function ItemFormModal({ open, onClose, onSubmit, initialData }) {
  const { categories } = useCategories()
  const isEdit = Boolean(initialData)

  const [form, setForm] = useState({ name: '', categoryId: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name:       initialData?.name ?? '',
        categoryId: initialData?.category_id ?? '',
        notes:      initialData?.notes ?? '',
      })
      setError('')
    }
  }, [open, initialData])

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      await onSubmit({
        name:       form.name.trim(),
        categoryId: form.categoryId || null,
        notes:      form.notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar item' : 'Adicionar item'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do item *"
          placeholder="Ex: Leite, Detergente..."
          value={form.name}
          onChange={set('name')}
          error={error}
          autoFocus
          maxLength={80}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <select
            value={form.categoryId}
            onChange={set('categoryId')}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Sem categoria</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Nota (opcional)"
          placeholder="Ex: Marca preferida, quantidade..."
          value={form.notes}
          onChange={set('notes')}
          maxLength={200}
        />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Guardar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
