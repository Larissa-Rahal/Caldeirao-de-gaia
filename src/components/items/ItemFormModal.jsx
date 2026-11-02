import { useState, useEffect } from 'react'
import { Search, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ImagePicker } from './ImagePicker'
import { ImageUploader } from './ImageUploader'
import { cn } from '@/lib/utils'

const IMAGE_MODES = [
  { key: 'search', label: 'Pesquisar', icon: Search },
  { key: 'upload', label: 'Carregar',  icon: Upload },
]

export function ItemFormModal({ open, onClose, onSubmit, initialData, categories = [] }) {
  const isEdit = Boolean(initialData)

  const [form,      setForm]      = useState({ name: '', categoryId: '', quantity: '', notes: '', imageUrl: '' })
  const [imageMode, setImageMode] = useState('search')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name:       initialData?.name        ?? '',
        categoryId: initialData?.category_id ?? '',
        quantity:   initialData?.quantity    ?? '',
        notes:      initialData?.notes       ?? '',
        imageUrl:   initialData?.image_url   ?? '',
      })
      setError('')
      setImageMode(
        initialData?.image_url?.includes('supabase') ? 'upload' : 'search'
      )
    }
  }, [open, initialData])

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function handleImageChange(url) {
    setForm(prev => ({ ...prev, imageUrl: url ?? '' }))
  }

  function handleModeChange(mode) {
    setImageMode(mode)
    setForm(prev => ({ ...prev, imageUrl: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      await onSubmit({
        name:       form.name.trim(),
        categoryId: form.categoryId  || null,
        quantity:   form.quantity.trim() || null,
        notes:      form.notes.trim() || null,
        imageUrl:   form.imageUrl    || null,
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

        {/* Categoria + Quantidade na mesma linha */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <select
              value={form.categoryId}
              onChange={set('categoryId')}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            label="Quantidade"
            placeholder="Ex: 2 kg, 1 L..."
            value={form.quantity}
            onChange={set('quantity')}
            maxLength={30}
          />
        </div>

        <Input
          label="Nota (opcional)"
          placeholder="Ex: Marca preferida..."
          value={form.notes}
          onChange={set('notes')}
          maxLength={200}
        />

        {/* ── Secção de imagem ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Imagem do produto</span>

            <div className="flex items-center gap-2">
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition"
                >
                  ✕ Remover
                </button>
              )}
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                {IMAGE_MODES.map(m => {
                  const Icon = m.icon
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleModeChange(m.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition',
                        imageMode === m.key
                          ? 'bg-white shadow text-primary-700'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Icon size={12} />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {imageMode === 'search' ? (
            <ImagePicker
              itemName={form.name}
              value={form.imageUrl}
              onChange={handleImageChange}
            />
          ) : (
            <ImageUploader
              value={form.imageUrl}
              onChange={handleImageChange}
            />
          )}
        </div>

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
